import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/* ------------------------------------------------------------------ */
/*  体素构建器：以整数网格坐标收集彩色体素，最终按颜色分组               */
/* ------------------------------------------------------------------ */

export interface VoxelGroupData {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  voxels: [number, number, number][];
}

interface InternalEntry {
  voxels: [number, number, number][];
  emissive?: string;
  emissiveIntensity?: number;
}

export class VoxelBuilder {
  private groups = new Map<string, InternalEntry>();
  private occupied = new Set<string>();
  count = 0;

  private keyOf(x: number, y: number, z: number) {
    return `${x}|${y}|${z}`;
  }

  /** 放置单个体素；已被占据的位置跳过（先到先得，避免重叠 Z-fighting） */
  set(x: number, y: number, z: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number }): this {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iz = Math.round(z);
    const key = this.keyOf(ix, iy, iz);
    if (this.occupied.has(key)) return this;
    this.occupied.add(key);
    const gKey = `${color}|${opts?.emissive ?? ''}|${opts?.emissiveIntensity ?? 0}`;
    let entry = this.groups.get(gKey);
    if (!entry) {
      entry = { voxels: [], emissive: opts?.emissive, emissiveIntensity: opts?.emissiveIntensity };
      this.groups.set(gKey, entry);
    }
    entry.voxels.push([ix, iy, iz]);
    this.count++;
    return this;
  }

  /** 实心长方体（含端点） */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number }): this {
    const [ax, bx] = x0 <= x1 ? [x0, x1] : [x1, x0];
    const [ay, by] = y0 <= y1 ? [y0, y1] : [y1, y0];
    const [az, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
    for (let x = ax; x <= bx; x++)
      for (let y = ay; y <= by; y++)
        for (let z = az; z <= bz; z++) this.set(x, y, z, color, opts);
    return this;
  }

  /** 单层实心圆盘 */
  disk(cx: number, cy: number, cz: number, r: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number; edgeSkip?: number }): this {
    const ri = Math.round(r);
    for (let x = -ri; x <= ri; x++) {
      for (let z = -ri; z <= ri; z++) {
        const d = Math.sqrt(x * x + z * z);
        if (d > r + 0.35) continue;
        // 有机边缘：外圈随机缺角
        if (opts?.edgeSkip && d > r - 0.8 && Math.random() < opts.edgeSkip) continue;
        this.set(cx + x, cy, cz + z, color, opts);
      }
    }
    return this;
  }

  /** 圆环（单层） */
  ring(cx: number, cy: number, cz: number, rInner: number, rOuter: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number }): this {
    const ro = Math.ceil(rOuter);
    for (let x = -ro; x <= ro; x++) {
      for (let z = -ro; z <= ro; z++) {
        const d = Math.sqrt(x * x + z * z);
        if (d >= rInner - 0.2 && d <= rOuter + 0.3) this.set(cx + x, cy, cz + z, color, opts);
      }
    }
    return this;
  }

  /** 实心圆柱（自下而上 h 层，支持上下半径渐变） */
  cylinder(cx: number, cy: number, cz: number, rBottom: number, rTop: number, h: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number }): this {
    for (let i = 0; i < h; i++) {
      const t = h <= 1 ? 0 : i / (h - 1);
      const r = rBottom + (rTop - rBottom) * t;
      this.disk(cx, cy + i, cz, r, color, opts);
    }
    return this;
  }

  /** 体素球体 */
  sphere(cx: number, cy: number, cz: number, r: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number; squashY?: number }): this {
    const ri = Math.ceil(r);
    const sy = opts?.squashY ?? 1;
    for (let x = -ri; x <= ri; x++)
      for (let y = -ri; y <= ri; y++)
        for (let z = -ri; z <= ri; z++) {
          const d = Math.sqrt(x * x + (y / sy) * (y / sy) + z * z);
          if (d <= r + 0.15) this.set(cx + x, cy + y, cz + z, color, opts);
        }
    return this;
  }

  /** 3D 直线（粗度为体素串） */
  line(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, opts?: { emissive?: string; emissiveIntensity?: number }): this {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.set(x0 + dx * t, y0 + dy * t, z0 + dz * t, color, opts);
    }
    return this;
  }

  /** 合并另一个构建器（整体偏移） */
  merge(other: VoxelBuilder, ox = 0, oy = 0, oz = 0): this {
    for (const [gKey, entry] of other.groups) {
      const [color, emissive, intensity] = gKey.split('|');
      const opts = emissive
        ? { emissive, emissiveIntensity: parseFloat(intensity) || 1 }
        : undefined;
      for (const [x, y, z] of entry.voxels) {
        this.set(x + ox, y + oy, z + oz, color, opts);
      }
    }
    return this;
  }

  getGroups(): VoxelGroupData[] {
    const out: VoxelGroupData[] = [];
    for (const [gKey, entry] of this.groups) {
      const color = gKey.split('|')[0];
      out.push({ color, emissive: entry.emissive, emissiveIntensity: entry.emissiveIntensity, voxels: entry.voxels });
    }
    return out;
  }
}

/* ------------------------------------------------------------------ */
/*  VoxelMesh：把构建器结果渲染为按颜色分组的 InstancedMesh             */
/* ------------------------------------------------------------------ */

const sharedBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/* ------------------------------------------------------------------ */
/*  暴露面裁剪：只为邻接空位的体素面生成几何。                          */
/*  山体/建筑内部被遮挡的面与整个内部体素直接不进入渲染与阴影管线，     */
/*  视觉结果逐像素不变，三角形量通常下降 60%~85%。                      */
/* ------------------------------------------------------------------ */

// 六个面：法线 + 四个顶点（绕序保证外法线朝向）；位序 i 对应暴露掩码第 i 位
const FACE_DEFS: { n: [number, number, number]; v: number[][] }[] = [
  { n: [1, 0, 0], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
  { n: [-1, 0, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
  { n: [0, 1, 0], v: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
  { n: [0, -1, 0], v: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  { n: [0, 0, 1], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
  { n: [0, 0, -1], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] }
];

/** 按暴露面掩码（哪些面暴露，而非仅数量）缓存实例几何，同掩码实例共享几何 */
const exposedGeometryCache = new Map<number, THREE.BufferGeometry>();

function getExposedGeometry(mask: number): THREE.BufferGeometry {
  let geo = exposedGeometryCache.get(mask);
  if (geo) return geo;
  const faceList: number[] = [];
  for (let f = 0; f < 6; f++) if (mask & (1 << f)) faceList.push(f);
  const positions = new Float32Array(faceList.length * 12);
  const normals = new Float32Array(faceList.length * 12);
  const indices = new Uint32Array(faceList.length * 6);
  faceList.forEach((f, slot) => {
    const def = FACE_DEFS[f];
    const vo = slot * 12;
    for (let c = 0; c < 4; c++) {
      positions[vo + c * 3] = def.v[c][0];
      positions[vo + c * 3 + 1] = def.v[c][1];
      positions[vo + c * 3 + 2] = def.v[c][2];
      normals[vo + c * 3] = def.n[0];
      normals[vo + c * 3 + 1] = def.n[1];
      normals[vo + c * 3 + 2] = def.n[2];
    }
    const io = slot * 6;
    const base = slot * 4;
    indices[io] = base; indices[io + 1] = base + 1; indices[io + 2] = base + 2;
    indices[io + 3] = base; indices[io + 4] = base + 2; indices[io + 5] = base + 3;
  });
  geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  exposedGeometryCache.set(mask, geo);
  return geo;
}

/** 计算每个体素的暴露面掩码（0 表示完全被包围，无需渲染） */
function computeExposure(allVoxels: [number, number, number][]): number[] {
  const occ = new Set<string>();
  for (const [x, y, z] of allVoxels) occ.add(`${x}|${y}|${z}`);
  return allVoxels.map(([x, y, z]) => {
    let mask = 0;
    if (!occ.has(`${x + 1}|${y}|${z}`)) mask |= 1 << 0;
    if (!occ.has(`${x - 1}|${y}|${z}`)) mask |= 1 << 1;
    if (!occ.has(`${x}|${y + 1}|${z}`)) mask |= 1 << 2;
    if (!occ.has(`${x}|${y - 1}|${z}`)) mask |= 1 << 3;
    if (!occ.has(`${x}|${y}|${z + 1}`)) mask |= 1 << 4;
    if (!occ.has(`${x}|${y}|${z - 1}`)) mask |= 1 << 5;
    return mask;
  });
}

/** 非发光体素共用的单一材质（颜色由 instanceColor 提供），大幅减少 draw call */
const sharedFlatMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.82,
  metalness: 0.04,
  flatShading: true
});

function getVoxelMaterial(color: string, emissive?: string, emissiveIntensity?: number): THREE.MeshStandardMaterial {
  const key = `${color}|${emissive ?? ''}|${emissiveIntensity ?? 0}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.82,
      metalness: 0.04,
      flatShading: true
    });
    if (emissive) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = emissiveIntensity ?? 1;
    }
    materialCache.set(key, mat);
  }
  return mat;
}

export interface VoxelMeshProps {
  builder: VoxelBuilder;
  /** 体素尺寸（世界单位），默认 1 */
  size?: number;
  /** 亮度抖动 0~1，让体块更有手感 */
  jitter?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const VoxelMesh: React.FC<VoxelMeshProps> = ({
  builder,
  size = 1,
  jitter = 0.09,
  castShadow = true,
  receiveShadow = true,
  position,
  rotation
}) => {
  const meshes = useMemo(() => {
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();
    const groups = builder.getGroups();
    const out: THREE.InstancedMesh[] = [];

    const writeVoxel = (mesh: THREE.InstancedMesh, i: number, v: [number, number, number], color: string) => {
      dummy.position.set(v[0] * size, v[1] * size, v[2] * size);
      dummy.scale.setScalar(size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      tmpColor.set(color);
      const j = 1 + (Math.random() - 0.5) * 2 * jitter;
      tmpColor.r = Math.min(1, tmpColor.r * j);
      tmpColor.g = Math.min(1, tmpColor.g * j);
      tmpColor.b = Math.min(1, tmpColor.b * j);
      mesh.setColorAt(i, tmpColor);
    };

    // 暴露面裁剪需要跨颜色组的邻居信息，先对所有体素统一计算暴露度，
    // 再按组的原始顺序切好偏移，避免两轮遍历计数错位
    const allVoxels = groups.flatMap((g) => g.voxels);
    const exposure = computeExposure(allVoxels);
    const groupExposure: number[][] = [];
    let offset = 0;
    for (const g of groups) {
      groupExposure.push(exposure.slice(offset, offset + g.voxels.length));
      offset += g.voxels.length;
    }

    // 非发光组合并为单个 InstancedMesh（一次 draw call 代替数十次）；
    // 内部体素（掩码为 0）直接剔除，其余按暴露面掩码分桶共享几何
    const flatEntries: { v: [number, number, number]; color: string; mask: number }[] = [];
    groups.forEach((g, gi) => {
      if (g.emissive) return;
      g.voxels.forEach((v, i) => {
        const mask = groupExposure[gi][i];
        if (mask === 0) return;
        flatEntries.push({ v, color: g.color, mask });
      });
    });
    const byMask = new Map<number, typeof flatEntries>();
    for (const e of flatEntries) {
      const list = byMask.get(e.mask);
      if (list) list.push(e);
      else byMask.set(e.mask, [e]);
    }
    for (const [mask, entries] of byMask) {
      const merged = new THREE.InstancedMesh(getExposedGeometry(mask), sharedFlatMaterial, entries.length);
      entries.forEach((e, i) => writeVoxel(merged, i, e.v, e.color));
      merged.instanceMatrix.needsUpdate = true;
      if (merged.instanceColor) merged.instanceColor.needsUpdate = true;
      merged.castShadow = castShadow;
      merged.receiveShadow = receiveShadow;
      out.push(merged);
    }

    // 发光组各自保留独立材质（数量少，自发光强度不可按实例区分），同样剔除内部体素
    groups.forEach((g, gi) => {
      if (!g.emissive) return;
      const exposed = g.voxels
        .map((v, i) => ({ v, mask: groupExposure[gi][i] }))
        .filter((e) => e.mask > 0);
      if (exposed.length === 0) return;
      const buckets = new Map<number, [number, number, number][]>();
      for (const e of exposed) {
        const list = buckets.get(e.mask);
        if (list) list.push(e.v);
        else buckets.set(e.mask, [e.v]);
      }
      for (const [mask, voxels] of buckets) {
        const mesh = new THREE.InstancedMesh(getExposedGeometry(mask), getVoxelMaterial(g.color, g.emissive, g.emissiveIntensity), voxels.length);
        voxels.forEach((v, i) => writeVoxel(mesh, i, v, g.color));
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        out.push(mesh);
      }
    });

    return out;
  }, [builder, size, jitter, castShadow, receiveShadow]);

  useEffect(() => {
    return () => {
      // 共享几何与缓存材质不做销毁，仅释放实例资源
      meshes.forEach((m) => m.dispose());
    };
  }, [meshes]);


  return (
    <group position={position} rotation={rotation}>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  VoxelWater：动画体素水面（正弦波起伏 + 棋盘色阶）                    */
/* ------------------------------------------------------------------ */

export interface VoxelWaterProps {
  /** 水面格子坐标列表 [x, z][] */
  cells: [number, number][];
  y?: number;
  colors?: string[];
  amplitude?: number;
  speed?: number;
  size?: number;
  opacity?: number;
  onClick?: (x: number, z: number) => void;
}

export const VoxelWater: React.FC<VoxelWaterProps> = ({
  cells,
  y = 0,
  colors = ['#2E7D8C', '#4FA3B1', '#7CC5C9'],
  amplitude = 0.28,
  speed = 1,
  size = 1,
  opacity = 1,
  onClick
}) => {
  // GPU 波动动画：实例矩阵只写一次，波浪位移交给顶点着色器，避免每帧 CPU 遍历
  const uTime = useMemo(() => ({ value: 0 }), []);
  const uParams = useMemo(() => ({ value: new THREE.Vector2(amplitude, speed) }), [amplitude, speed]);

  const mesh = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.32,
      metalness: 0.12,
      flatShading: true,
      transparent: opacity < 1,
      opacity
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime;
      shader.uniforms.uParams = uParams;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uTime;
uniform vec2 uParams; // x: amplitude, y: speed`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
#ifdef USE_INSTANCING
          vec3 wp = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          float wv = sin(wp.x * 0.45 + uTime * uParams.y * 1.7) * 0.55
                   + cos(wp.z * 0.38 + uTime * uParams.y * 1.25) * 0.45;
          transformed.y *= (0.55 + 0.1 * sin(uTime * uParams.y + wp.x + wp.z));
          transformed.y += wv * uParams.x;
#endif`
        );
    };

    const m = new THREE.InstancedMesh(sharedBoxGeometry, mat, cells.length);
    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();
    cells.forEach(([x, z], i) => {
      // 棋盘 + 随机的色阶，让水面像宝石拼块
      const idx = Math.abs((x * 7 + z * 13) % 10) < 2 ? 2 : Math.abs(x + z) % 2;
      tmpColor.set(colors[idx % colors.length]);
      const j = 1 + (Math.random() - 0.5) * 0.12;
      tmpColor.r = Math.min(1, tmpColor.r * j);
      tmpColor.g = Math.min(1, tmpColor.g * j);
      tmpColor.b = Math.min(1, tmpColor.b * j);
      m.setColorAt(i, tmpColor);
      dummy.position.set(x * size, y, z * size);
      dummy.scale.setScalar(size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.instanceMatrix.needsUpdate = true;
    m.receiveShadow = true;
    return m;
  }, [cells, colors, opacity, size, y, uTime, uParams]);

  useEffect(() => () => { mesh.dispose(); (mesh.material as THREE.Material).dispose(); }, [mesh]);

  // 每帧只推一个时间 uniform，不再遍历全部水格
  useFrame((state) => {
    uTime.value = state.clock.getElapsedTime();
  });

  return (
    <primitive
      object={mesh}
      onClick={
        onClick
          ? (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
              e.stopPropagation();
              onClick(Math.round(e.point.x / size), Math.round(e.point.z / size));
            }
          : undefined
      }
    />
  );
};

/** 生成椭圆湖泊的格子坐标 */
export function lakeCells(rx: number, rz: number, edgeNoise = 0.75): [number, number][] {
  const out: [number, number][] = [];
  for (let x = -rx; x <= rx; x++) {
    for (let z = -rz; z <= rz; z++) {
      const d = (x * x) / (rx * rx) + (z * z) / (rz * rz);
      if (d <= 1 && (d < edgeNoise || Math.random() > 0.45)) {
        out.push([x, z]);
      }
    }
  }
  return out;
}
