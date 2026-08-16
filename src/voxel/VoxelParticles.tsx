import React, { useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export type ParticleMode = 'petal' | 'snow' | 'firefly' | 'leaf';

export interface VoxelParticlesProps {
  count: number;
  mode: ParticleMode;
  colors: string[];
  /** 粒子活动范围（世界坐标盒） */
  bounds: { x: number; z: number; w: number; h: number; d: number; floor?: number };
  size?: number;
  speed?: number;
  /** 是否响应鼠标涡旋（花瓣/落叶） */
  mouseVortex?: boolean;
  emissive?: boolean;
}

interface ParticleState {
  x: number;
  y: number;
  z: number;
  vy: number;
  phase: number;
  sway: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeed: number;
  scale: number;
}

export const VoxelParticles: React.FC<VoxelParticlesProps> = ({
  count,
  mode,
  colors,
  bounds,
  size = 0.22,
  speed = 1,
  mouseVortex = false,
  emissive = false
}) => {
  const { pointer } = useThree();

  const mesh = useMemo(() => {
    const geom = new THREE.BoxGeometry(size, size * (mode === 'petal' || mode === 'leaf' ? 0.35 : 1), size);
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.6,
      flatShading: true,
      emissive: emissive ? new THREE.Color(colors[0]) : new THREE.Color('#000000'),
      emissiveIntensity: emissive ? 1.6 : 0
    });
    const m = new THREE.InstancedMesh(geom, mat, count);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      tmp.set(colors[i % colors.length]);
      const j = 1 + (Math.random() - 0.5) * 0.25;
      tmp.r = Math.min(1, tmp.r * j);
      tmp.g = Math.min(1, tmp.g * j);
      tmp.b = Math.min(1, tmp.b * j);
      m.setColorAt(i, tmp);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    return m;
  }, [count, mode, colors, size, emissive]);

  useEffect(() => () => { mesh.dispose(); mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); }, [mesh]);

  const particles = useMemo<ParticleState[]>(() => {
    return Array.from({ length: count }).map(() => ({
      x: bounds.x + (Math.random() - 0.5) * bounds.w,
      y: (bounds.floor ?? 0) + Math.random() * bounds.h,
      z: bounds.z + (Math.random() - 0.5) * bounds.d,
      vy: mode === 'firefly' ? (Math.random() * 0.4 + 0.2) : (Math.random() * 0.8 + 0.6),
      phase: Math.random() * Math.PI * 2,
      sway: 0.4 + Math.random() * 0.9,
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      rotZ: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      scale: 0.7 + Math.random() * 0.6
    }));
  }, [count, mode, bounds]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const floor = bounds.floor ?? 0;
    // 鼠标世界近似（场景以原点为中心）
    const mx = pointer.x * bounds.w * 0.55;
    const mz = -pointer.y * bounds.d * 0.5;

    particles.forEach((p, i) => {
      p.rotX += p.rotSpeed;
      p.rotY += p.rotSpeed * 1.4;

      if (mode === 'snow') {
        p.y -= p.vy * 1.6 * speed * 0.016;
        p.x += Math.sin(t * 1.2 + p.phase) * 0.012 * p.sway;
        p.z += Math.cos(t * 0.9 + p.phase) * 0.012 * p.sway;
      } else if (mode === 'firefly') {
        p.y += Math.sin(t * 0.8 + p.phase) * 0.008;
        p.x += Math.sin(t * 0.6 + p.phase * 2) * 0.014 * p.sway;
        p.z += Math.cos(t * 0.5 + p.phase) * 0.014 * p.sway;
        // 萤火虫缓慢上浮并循环
        p.y += 0.004 * speed;
        if (p.y > bounds.h) p.y = floor + 0.5;
      } else {
        // 花瓣 / 落叶飘落
        p.y -= p.vy * speed * 0.035;
        p.x += Math.sin(t * 1.6 + p.phase) * 0.02 * p.sway;
        p.z += Math.cos(t * 1.3 + p.phase) * 0.02 * p.sway;
      }

      // 鼠标涡旋：吸引 + 抬升 + 切向旋转
      if (mouseVortex && mode !== 'firefly') {
        const dx = p.x - mx;
        const dz = p.z - mz;
        const dist = Math.hypot(dx, dz);
        if (dist < 6 && dist > 0.01) {
          const force = (1 - dist / 6) * 0.09;
          // 切向
          p.x += (-dz / dist) * force * 2.2;
          p.z += (dx / dist) * force * 2.2;
          // 抬升
          p.y += force * 1.6;
        }
      }

      // 边界循环
      if (p.y < floor) {
        p.y = bounds.h;
        p.x = bounds.x + (Math.random() - 0.5) * bounds.w;
        p.z = bounds.z + (Math.random() - 0.5) * bounds.d;
      }
      if (p.x < bounds.x - bounds.w / 2 - 2) p.x = bounds.x + bounds.w / 2;
      if (p.x > bounds.x + bounds.w / 2 + 2) p.x = bounds.x - bounds.w / 2;
      if (p.z < bounds.z - bounds.d / 2 - 2) p.z = bounds.z + bounds.d / 2;
      if (p.z > bounds.z + bounds.d / 2 + 2) p.z = bounds.z - bounds.d / 2;

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      let s = p.scale;
      if (mode === 'firefly') s = p.scale * (0.6 + 0.4 * Math.sin(t * 3 + p.phase * 3));
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={mesh} />;
};
