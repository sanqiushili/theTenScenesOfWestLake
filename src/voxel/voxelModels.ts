import * as THREE from 'three';
import { VoxelBuilder } from './VoxelKit';
import { PAL } from './palette';

/* ------------------------------------------------------------------ */
/*  植被                                                               */
/* ------------------------------------------------------------------ */

/** 垂柳：弯曲树干 + 下垂柳丝 */
export function makeWillow(b: VoxelBuilder, x: number, y: number, z: number, height = 5, crownR = 2): void {
  const lean = Math.random() > 0.5 ? 1 : -1;
  for (let i = 0; i < height; i++) {
    b.set(x + Math.round(Math.sin(i * 0.4) * lean * 0.6), y + i, z, i < 2 ? PAL.woodDark : PAL.wood);
  }
  const topY = y + height;
  // 树冠核心
  b.sphere(x, topY, z, crownR * 0.75, PAL.willow);
  // 下垂柳丝
  const strands = 8 + Math.floor(Math.random() * 5);
  for (let s = 0; s < strands; s++) {
    const ang = (s / strands) * Math.PI * 2 + Math.random() * 0.4;
    const r = crownR * (0.7 + Math.random() * 0.5);
    const sx = x + Math.cos(ang) * r;
    const sz = z + Math.sin(ang) * r;
    const len = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < len; i++) {
      b.set(
        sx + Math.sin(i * 0.8 + s) * 0.2,
        topY + 1 - i,
        sz + Math.cos(i * 0.7 + s) * 0.2,
        i % 3 === 0 ? PAL.willowDark : PAL.willow
      );
    }
  }
}

/** 桃树：树干 + 粉嫩双层树冠 */
export function makePeach(b: VoxelBuilder, x: number, y: number, z: number, height = 4): void {
  for (let i = 0; i < height; i++) b.set(x, y + i, z, i === 0 ? PAL.woodDark : PAL.wood);
  const topY = y + height;
  b.sphere(x, topY, z, 2.1, PAL.peachPink);
  b.sphere(x + 1, topY + 1, z - 1, 1.2, PAL.peachDeep);
  // 零星深粉点缀
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = 1.5 + Math.random();
    b.set(x + Math.cos(a) * rr, topY + (Math.random() * 2 - 0.5), z + Math.sin(a) * rr, PAL.peachDeep);
  }
}

/** 松树：深绿叠层塔状冠 */
export function makePine(b: VoxelBuilder, x: number, y: number, z: number, height = 6): void {
  const trunkH = Math.max(2, height - 4);
  for (let i = 0; i < trunkH; i++) b.set(x, y + i, z, PAL.woodDark);
  let ly = y + trunkH;
  let r = 2.4;
  while (r > 0.5) {
    b.disk(x, ly, z, r, Math.random() > 0.4 ? PAL.pine : PAL.pineDark, { edgeSkip: 0.2 });
    if (r > 1.2) b.disk(x, ly + 1, z, r - 0.9, PAL.pineDark, { edgeSkip: 0.25 });
    ly += 2;
    r -= 0.9;
  }
  b.set(x, ly, z, PAL.pine);
}

/** 梅树：虬曲深色枝干 + 白粉梅花簇 */
export function makePlum(b: VoxelBuilder, x: number, y: number, z: number): void {
  const lean = Math.random() > 0.5 ? 1 : -1;
  for (let i = 0; i < 4; i++) b.set(x + Math.round(i * 0.4) * lean, y + i, z, PAL.woodDark);
  b.line(x + lean, y + 3, z, x + lean * 3, y + 5, z + 1, PAL.woodDark);
  b.line(x + lean, y + 3, z, x - lean, y + 5, z - 1, PAL.woodDark);
  // 花簇
  const spots: [number, number, number][] = [
    [x + lean * 3, y + 5.5, z + 1],
    [x - lean, y + 5.5, z - 1],
    [x + lean, y + 4.5, z + 0.5],
    [x, y + 4, z]
  ];
  spots.forEach(([sx, sy, sz], i) => {
    b.sphere(sx, sy, sz, 1.5, i % 2 === 0 ? PAL.plumWhite : PAL.plumPink);
  });
}

/** 荷叶（贴水）与荷花 */
export function makeLotusLeaf(b: VoxelBuilder, x: number, y: number, z: number, r = 1.6): void {
  b.disk(x, y, z, r, Math.random() > 0.5 ? PAL.lotusLeaf : PAL.lotusLeafDark, { edgeSkip: 0.12 });
}

export function makeLotusFlower(b: VoxelBuilder, x: number, y: number, z: number, bloom = true): void {
  for (let i = 0; i < 3; i++) b.set(x, y + i, z, PAL.lotusLeafDark);
  if (bloom) {
    b.set(x, y + 3, z, PAL.lotusSeed);
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      b.set(x + Math.cos(a) * 1.1, y + 3, z + Math.sin(a) * 1.1, PAL.lotusPink);
      b.set(x + Math.cos(a + 0.5) * 0.7, y + 3.7, z + Math.sin(a + 0.5) * 0.7, PAL.lotusDeep);
    }
  } else {
    b.set(x, y + 3, z, PAL.lotusDeep);
    b.set(x, y + 4, z, PAL.lotusPink);
  }
}

/** 枯树（冬景） */
export function makeBareTree(b: VoxelBuilder, x: number, y: number, z: number): void {
  for (let i = 0; i < 5; i++) b.set(x, y + i, z, PAL.woodDark);
  b.line(x, y + 4, z, x + 2, y + 6, z + 1, PAL.woodDark);
  b.line(x, y + 3, z, x - 2, y + 5, z - 1, PAL.woodDark);
  b.line(x, y + 4.5, z, x + 1, y + 7, z - 1, PAL.woodDark);
}

/* ------------------------------------------------------------------ */
/*  建筑                                                               */
/* ------------------------------------------------------------------ */

/** 中式亭：四柱 + 叠涩攒尖顶 */
export function makePavilion(b: VoxelBuilder, x: number, y: number, z: number, r = 2, roofColor: string = PAL.roofDark): void {
  b.disk(x, y, z, r + 1, PAL.stone);
  const posts: [number, number][] = [
    [-r + 0.5, -r + 0.5],
    [-r + 0.5, r - 0.5],
    [r - 0.5, -r + 0.5],
    [r - 0.5, r - 0.5]
  ];
  posts.forEach(([px, pz]) => {
    for (let i = 1; i <= 3; i++) b.set(x + px, y + i, z + pz, PAL.vermilion);
  });
  // 攒尖顶
  b.disk(x, y + 4, z, r + 1, roofColor);
  b.disk(x, y + 5, z, r - 0.4, roofColor);
  b.disk(x, y + 6, z, Math.max(0.6, r - 1.4), roofColor);
  b.set(x, y + 7, z, PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.35 });
}

/** 多层宝塔（雷峰塔式）：石基 + N 层塔身 + 飞檐 + 金色塔刹 */
export function makePagoda(
  b: VoxelBuilder,
  x: number,
  y: number,
  z: number,
  floors = 5,
  baseR = 4,
  opts?: { lit?: boolean }
): void {
  const lit = opts?.lit ?? true;
  // 石砌台基
  b.disk(x, y, z, baseR + 1.5, PAL.stoneDark);
  b.disk(x, y + 1, z, baseR + 1, PAL.stone);
  let cy = y + 2;
  for (let f = 0; f < floors; f++) {
    const r = baseR - f * 0.62;
    // 塔身（朱壁）
    b.cylinder(x, cy, z, r, r, 2, PAL.vermilion);
    // 窗洞（发光）
    const winCount = 4;
    for (let w = 0; w < winCount; w++) {
      const a = (w / winCount) * Math.PI * 2 + (f % 2) * 0.4;
      b.set(
        x + Math.cos(a) * (r - 0.1),
        cy + 1,
        z + Math.sin(a) * (r - 0.1),
        lit ? PAL.goldBright : PAL.woodDark,
        lit ? { emissive: PAL.candle, emissiveIntensity: 1.6 } : undefined
      );
    }
    // 飞檐（深青瓦 + 金边翘角）
    b.disk(x, cy + 2, z, r + 1.3, PAL.roofDark);
    for (let w = 0; w < 8; w++) {
      const a = (w / 8) * Math.PI * 2;
      b.set(x + Math.cos(a) * (r + 1.3), cy + 3, z + Math.sin(a) * (r + 1.3), PAL.gold, {
        emissive: PAL.gold,
        emissiveIntensity: 0.25
      });
    }
    cy += 3;
  }
  // 塔刹
  b.disk(x, cy, z, 1.4, PAL.roofDark);
  b.set(x, cy + 1, z, PAL.gold);
  b.set(x, cy + 2, z, PAL.gold, { emissive: PAL.goldBright, emissiveIntensity: 0.9 });
  b.set(x, cy + 3, z, PAL.goldBright, { emissive: PAL.goldBright, emissiveIntensity: 1.4 });
}

/** 三潭印月石塔：基座 + 塔柱 + 圆腹（五孔） + 荷叶顶 */
export function makeStoneTower(b: VoxelBuilder, x: number, y: number, z: number, lit = false): void {
  b.disk(x, y, z, 2, PAL.stoneDark);
  b.disk(x, y + 1, z, 1.6, PAL.stone);
  b.cylinder(x, y + 2, z, 0.8, 0.8, 2, PAL.stoneDark);
  // 圆腹
  b.sphere(x, y + 5, z, 1.8, PAL.wallGray, { squashY: 0.9 });
  // 五个透光孔
  for (let w = 0; w < 5; w++) {
    const a = (w / 5) * Math.PI * 2;
    b.set(
      x + Math.cos(a) * 1.7,
      y + 5,
      z + Math.sin(a) * 1.7,
      lit ? PAL.candle : PAL.rockDark,
      lit ? { emissive: PAL.candle, emissiveIntensity: 2.2 } : undefined
    );
  }
  // 荷叶形塔顶
  b.disk(x, y + 7, z, 1.5, PAL.roofDark);
  b.disk(x, y + 8, z, 0.8, PAL.roofDark);
  b.set(x, y + 9, z, PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.5 });
}

/** 石拱桥（沿 x 或 z 方向） */
export function makeArchBridge(
  b: VoxelBuilder,
  cx: number,
  cz: number,
  along: 'x' | 'z',
  span = 11,
  width = 3,
  height = 3,
  deckColor = PAL.pathStone,
  railColor = PAL.wallWhite,
  baseY = 0
): void {
  const half = Math.floor(span / 2);
  const halfW = Math.floor(width / 2);
  for (let i = 0; i <= span; i++) {
    const t = i / span;
    const archY = baseY + Math.round(Math.sin(t * Math.PI) * height);
    // 桥墩：两端填实，中部留拱洞
    const solid = t < 0.22 || t > 0.78;
    for (let w = -halfW; w <= halfW; w++) {
      const x = along === 'x' ? cx - half + i : cx + w;
      const z = along === 'z' ? cz - half + i : cz + w;
      b.set(x, archY, z, deckColor);
      if (solid) {
        for (let yy = Math.max(0, baseY - 1); yy < archY; yy++) b.set(x, yy, z, PAL.stoneDark);
      } else if (archY - baseY >= 2) {
        // 拱洞边缘薄壳
        b.set(x, archY - 1, z, deckColor);
      }
    }
    // 栏杆望柱
    if (i % 2 === 0) {
      for (const w of [-halfW, halfW]) {
        const x = along === 'x' ? cx - half + i : cx + w;
        const z = along === 'z' ? cz - half + i : cz + w;
        b.set(x, archY + 1, z, railColor);
      }
    }
  }
}

/** 乌篷船 */
export function makeBoat(b: VoxelBuilder, x: number, y: number, z: number, canopy = true): void {
  // 船身
  b.box(x - 2, y, z, x + 2, y, z, PAL.wood);
  b.set(x - 3, y + 1, z, PAL.woodDark);
  b.set(x + 3, y + 1, z, PAL.woodDark);
  b.set(x - 2, y + 1, z, PAL.wood);
  b.set(x + 2, y + 1, z, PAL.wood);
  if (canopy) {
    for (const px of [-1, 1]) b.set(x + px, y + 1, z, PAL.woodDark);
    b.box(x - 1, y + 2, z, x + 1, y + 2, z, PAL.roofDark);
  }
}

/** 长堤（含路边桃柳位置由调用者补种） */
export function makeCauseway(
  b: VoxelBuilder,
  x: number,
  z0: number,
  z1: number,
  width = 2,
  topY = 1
): void {
  const [a, bz] = z0 <= z1 ? [z0, z1] : [z1, z0];
  for (let z = a; z <= bz; z++) {
    for (let w = -Math.floor(width / 2); w <= Math.floor(width / 2); w++) {
      b.set(x + w, topY, z, Math.abs(w) === Math.floor(width / 2) ? PAL.grassDark : PAL.sand);
      b.set(x + w, topY - 1, z, PAL.dirt);
    }
  }
}

/** 体素微缩景观浮岛底座（悬崖裙边 + 草皮 + 沙滩，可挖出水域） */
export function makeDioramaBase(
  b: VoxelBuilder,
  r: number,
  waterHole?: (x: number, z: number) => boolean,
  opts?: { snow?: boolean }
): void {
  const snow = opts?.snow ?? false;
  for (let x = -r; x <= r; x++) {
    for (let z = -r; z <= r; z++) {
      const d = Math.sqrt(x * x + z * z);
      if (d > r + 0.3) continue;
      const inWater = waterHole ? waterHole(x, z) : false;
      const edge = d > r - 2;
      if (!inWater) {
        if (snow) {
          b.set(x, -1, z, Math.random() > 0.18 ? PAL.snow : PAL.snowShadow);
        } else if (edge) {
          b.set(x, -1, z, Math.random() > 0.5 ? PAL.sand : PAL.sandDark);
        } else {
          const rnd = Math.random();
          b.set(x, -1, z, rnd > 0.85 ? PAL.grassLight : rnd < 0.2 ? PAL.grassDark : PAL.grass);
        }
      }
      // 悬崖裙边
      b.set(x, -2, z, inWater ? PAL.rockDark : snow ? PAL.snowShadow : PAL.dirt);
      if (d <= r - 0.5) b.set(x, -3, z, d <= r - 2.5 ? PAL.rockDark : PAL.rock);
    }
  }
}

/** 垂柳树冠（原点构建，供独立 group 摇曳动画使用） */
export function makeWillowCrown(b: VoxelBuilder, crownR = 2): void {
  b.sphere(0, 0, 0, crownR * 0.75, PAL.willow);
  const strands = 9 + Math.floor(Math.random() * 4);
  for (let s = 0; s < strands; s++) {
    const ang = (s / strands) * Math.PI * 2 + Math.random() * 0.4;
    const r = crownR * (0.7 + Math.random() * 0.5);
    const sx = Math.cos(ang) * r;
    const sz = Math.sin(ang) * r;
    const len = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < len; i++) {
      b.set(
        sx + Math.sin(i * 0.8 + s) * 0.2,
        1 - i,
        sz + Math.cos(i * 0.7 + s) * 0.2,
        i % 3 === 0 ? PAL.willowDark : PAL.willow
      );
    }
  }
}

/** 山丘：自下而上收缩的有机圆盘，底部岩石顶部草皮 */
export function makeHill(
  b: VoxelBuilder,
  cx: number,
  cz: number,
  radius: number,
  height: number,
  opts?: { snow?: boolean; rocky?: boolean }
): void {
  for (let h = 0; h < height; h++) {
    const t = h / Math.max(1, height - 1);
    const r = radius * Math.pow(1 - t, 0.75);
    if (r < 0.5) break;
    const isTop = h >= height - 2;
    const grassC = opts?.snow ? PAL.snow : Math.random() > 0.5 ? PAL.grass : PAL.grassDark;
    const rockC = opts?.snow ? PAL.snowShadow : Math.random() > 0.5 ? PAL.rock : PAL.rockDark;
    const color = opts?.rocky ? rockC : isTop ? grassC : t > 0.55 ? (Math.random() > 0.5 ? grassC : rockC) : rockC;
    b.disk(cx, h, cz, r, color, { edgeSkip: 0.22 });
  }
}

/** 体素云团 */
export function makeCloud(b: VoxelBuilder, x: number, y: number, z: number, r = 3, color: string = PAL.cloud): void {
  b.sphere(x, y, z, r, color, { squashY: 2.2 });
  b.sphere(x + r * 1.1, y, z + r * 0.3, r * 0.65, color, { squashY: 2.2 });
  b.sphere(x - r * 1.05, y, z - r * 0.25, r * 0.7, color, { squashY: 2.4 });
}

/** 湖石假山 */
export function makeRock(b: VoxelBuilder, x: number, y: number, z: number, r = 1.6): void {
  b.sphere(x, y, z, r, Math.random() > 0.5 ? PAL.rock : PAL.rockDark, { squashY: 1.3 });
  if (r > 1.2) b.sphere(x + r * 0.7, y, z + r * 0.4, r * 0.5, PAL.rockLight, { squashY: 1.4 });
}

/** 石灯笼 */
export function makeLantern(b: VoxelBuilder, x: number, y: number, z: number): void {
  b.set(x, y, z, PAL.stoneDark);
  b.set(x, y + 1, z, PAL.stone);
  b.set(x, y + 2, z, PAL.nightLantern, { emissive: PAL.nightLantern, emissiveIntensity: 1.8 });
  b.disk(x, y + 3, z, 0.9, PAL.roofDark);
  b.set(x, y + 4, z, PAL.roofDark);
}

/** 寺钟（可撞） + 钟架 */
export function makeBellFrame(b: VoxelBuilder, x: number, y: number, z: number): void {
  // 横梁架
  for (const px of [-2.5, 2.5]) for (let i = 0; i <= 5; i++) b.set(x + px, y + i, z, PAL.vermilion);
  b.box(x - 2.5, y + 5, z, x + 2.5, y + 5, z, PAL.vermilion);
  b.box(x - 3, y + 6, z - 0.5, x + 3, y + 6, z + 0.5, PAL.roofDark);
}

/** 锦鲤（体素鱼） */
export function makeKoi(b: VoxelBuilder, x: number, y: number, z: number, color: string = PAL.koiOrange): void {
  b.box(x - 1, y, z, x + 1, y, z, color);
  b.set(x + 2, y, z, color);
  b.set(x - 2, y + 0, z, color === PAL.koiWhite ? PAL.koiRed : PAL.koiWhite); // 尾
  b.set(x + 1, y + 1, z, color); // 背
}

/** 用 InstancedMesh 表达一群飞鸟，返回控制句柄 */
export interface FlockHandle {
  mesh: THREE.InstancedMesh;
  update: (time: number, dt: number, startled: number) => void;
}

export function createFlock(count: number, center: THREE.Vector3, spread: number, color: string = PAL.egret): FlockHandle {
  const geom = new THREE.BoxGeometry(0.55, 0.16, 0.34);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true });
  const mesh = new THREE.InstancedMesh(geom, mat, count);
  const dummy = new THREE.Object3D();

  const birds = Array.from({ length: count }).map(() => ({
    pos: new THREE.Vector3(
      center.x + (Math.random() - 0.5) * spread,
      center.y + Math.random() * 4,
      center.z + (Math.random() - 0.5) * spread
    ),
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.6,
    radius: 3 + Math.random() * spread * 0.6,
    startleVel: new THREE.Vector3()
  }));

  let startleEnergy = 0;

  const update = (time: number, dt: number, startled: number) => {
    startleEnergy = Math.max(startleEnergy, startled);
    startleEnergy = Math.max(0, startleEnergy - dt * 0.25);

    birds.forEach((bird, i) => {
      // 盘旋
      const ang = time * bird.speed * 0.4 + bird.phase;
      const target = new THREE.Vector3(
        center.x + Math.cos(ang) * bird.radius,
        center.y + Math.sin(time * 0.7 + bird.phase) * 1.2 + startleEnergy * (6 + (i % 4)),
        center.z + Math.sin(ang) * bird.radius
      );
      if (startleEnergy > 0.05) {
        target.y += startleEnergy * 8;
        target.x += Math.cos(bird.phase) * startleEnergy * 10;
        target.z += Math.sin(bird.phase) * startleEnergy * 10;
      }
      bird.pos.lerp(target, Math.min(1, dt * (1.2 + startleEnergy * 3)));

      dummy.position.copy(bird.pos);
      dummy.rotation.set(0, -ang, Math.sin(time * 9 + bird.phase) * 0.55);
      dummy.scale.set(1 + startleEnergy * 0.3, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  return { mesh, update };
}
