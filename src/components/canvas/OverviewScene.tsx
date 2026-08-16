import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWestLakeStore, WEST_LAKE_SCENES, SceneId } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { VoxelBuilder, VoxelMesh, VoxelWater, lakeCells } from '../../voxel/VoxelKit';
import { PAL } from '../../voxel/palette';
import {
  makeWillow, makePeach, makePine, makePlum, makeBareTree,
  makeHill, makePagoda, makeStoneTower, makePavilion, makeArchBridge,
  makeCloud, makeRock, makeLotusLeaf, makeLotusFlower, makeLantern, makeBoat
} from '../../voxel/voxelModels';

type ValidSceneId = Exclude<SceneId, 'overview'>;

const LAKE_RX = 30;
const LAKE_RZ = 22;

/** 十景地标标记位置（贴合沙盘地理） */
const SCENE_MARKERS: { id: ValidSceneId; pos: [number, number, number] }[] = [
  { id: 'su_di', pos: [-6, 2.6, 0] },
  { id: 'qu_yuan', pos: [-14, 1.8, -14] },
  { id: 'san_tan', pos: [-4, 2.4, 10] },
  { id: 'duan_qiao', pos: [18, 3.6, -19] },
  { id: 'liu_lang', pos: [27, 2.6, 0] },
  { id: 'shuang_feng', pos: [-40, 16.5, 6] },
  { id: 'lei_feng', pos: [-10, 1.8, 23.5] },
  { id: 'nan_ping', pos: [10, 1.8, 25] },
  { id: 'ling_feng', pos: [-28, 5.2, -16] },
  { id: 'hua_gang', pos: [-13, 1.6, 24] }
];

/* ------------------------------------------------------------------ */
/*  沙盘静态世界（一次性构建）                                          */
/* ------------------------------------------------------------------ */

function buildWorld(): VoxelBuilder {
  const b = new VoxelBuilder();

  /* 1. 大地与湖岸 */
  for (let x = -58; x <= 58; x++) {
    for (let z = -48; z <= 48; z++) {
      const d = (x * x) / (LAKE_RX * LAKE_RX) + (z * z) / (LAKE_RZ * LAKE_RZ);
      if (d <= 1.02) continue; // 湖底
      // 花港观鱼小池塘挖洞
      const pondD = (x + 18) * (x + 18) + (z - 24) * (z - 24);
      if (pondD <= 20) continue;

      const rnd = Math.random();
      let c: string = PAL.grass;
      if (rnd > 0.86) c = PAL.grassLight;
      else if (rnd < 0.16) c = PAL.grassDark;
      if (rnd > 0.988) c = PAL.moss;
      b.set(x, -1, z, c);

      // 沙滩环
      if (d <= 1.16) {
        b.set(x, 0, z, Math.random() > 0.5 ? PAL.sand : PAL.sandDark);
      } else if (Math.random() > 0.994) {
        // 草地野花点缀
        b.set(x, 0, z, Math.random() > 0.5 ? PAL.peachPink : PAL.goldBright);
      }
    }
  }

  /* 2. 群山 */
  makeHill(b, 2, -27, 6, 5);          // 孤山
  makeHill(b, -38, -2, 9, 13);        // 北高峰
  makeHill(b, -43, 15, 9, 15);        // 南高峰
  makeHill(b, -10, 30, 7, 6);         // 雷峰塔所在夕照山
  makeHill(b, 10, 32, 8, 5);          // 南屏山
  makeHill(b, 30, 30, 9, 7);          // 玉皇山余脉
  makeHill(b, 40, 8, 7, 5);           // 东岸山
  makeHill(b, -30, -32, 10, 8);       // 西北远山
  makeHill(b, 0, -40, 12, 7);         // 北远山
  makeHill(b, 24, -34, 9, 6);         // 宝石山
  makeHill(b, -52, 26, 8, 10, { snow: true });  // 西边雪岭
  makeHill(b, -28, -16, 5, 4);        // 灵峰小丘

  /* 3. 苏堤（南北纵贯）与六桥简化三桥 */
  for (let z = -20; z <= 20; z++) {
    for (const w of [-1, 0, 1]) {
      b.set(-6 + w, 1, z, w === 0 ? PAL.sand : PAL.grassDark);
      b.set(-6 + w, 0, z, PAL.dirt);
    }
  }
  makeArchBridge(b, -6, -12, 'z', 5, 3, 2, PAL.pathStone, PAL.wallWhite, 1);
  makeArchBridge(b, -6, 0, 'z', 5, 3, 2, PAL.pathStone, PAL.wallWhite, 1);
  makeArchBridge(b, -6, 12, 'z', 5, 3, 2, PAL.pathStone, PAL.wallWhite, 1);

  // 苏堤桃柳相间
  for (let z = -18, i = 0; z <= 18; z += 4, i++) {
    const side = i % 2 === 0 ? -3 : 3;
    if (i % 2 === 0) makePeach(b, -6 + side, 2, z, 3);
    else makeWillow(b, -6 + side, 2, z, 4, 1.7);
  }

  /* 4. 白堤与断桥 */
  for (let x = -2; x <= 14; x++) {
    b.set(x, 1, -19, PAL.sand);
    b.set(x, 1, -20, PAL.grassDark);
    b.set(x, 0, -19, PAL.dirt);
    b.set(x, 0, -20, PAL.dirt);
  }
  makeArchBridge(b, 18, -19, 'x', 7, 3, 3, PAL.pathStone, PAL.wallWhite, 0);
  makePine(b, 1, 2, -20, 4);
  makePine(b, 8, 2, -20, 5);

  /* 5. 湖心岛屿 */
  // 小瀛洲（三潭印月岛）
  b.disk(-4, 0, 10, 4.6, PAL.sand, { edgeSkip: 0.12 });
  b.disk(-4, 1, 10, 3.4, PAL.grass);
  makeStoneTower(b, -8, 0, 14, false);
  makeStoneTower(b, 0, 0, 14, false);
  makeStoneTower(b, -4, 0, 6, false);

  // 湖心亭
  b.disk(9, 0, -1, 3, PAL.sand, { edgeSkip: 0.12 });
  b.disk(9, 1, -1, 2.2, PAL.grassLight);
  makePavilion(b, 9, 1, -1, 1.5, PAL.roofBlue);

  // 阮公墩
  b.disk(-2, 0, -6, 2.2, PAL.sand, { edgeSkip: 0.15 });
  makePine(b, -2, 1, -6, 4);

  /* 6. 雷峰塔 */
  makePagoda(b, -10, 6, 30, 5, 3.5, { lit: true });

  /* 7. 净慈寺（南屏晚钟） */
  b.box(7, 5, 30, 13, 7, 34, PAL.wallWhite);
  b.box(7, 8, 29, 13, 8, 35, PAL.roofDark);
  b.box(8, 9, 30, 12, 9, 34, PAL.roofDark);
  b.set(10, 10, 32, PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.6 });
  b.box(9, 5, 31, 11, 6, 33, PAL.vermilion);

  /* 8. 双峰插云之间的云带 */
  makeCloud(b, -40, 10, 6, 3);
  makeCloud(b, -36, 12, 2, 2.2);
  makeCloud(b, -44, 11, 10, 2.5);

  /* 9. 柳浪闻莺（东岸柳林） */
  makeWillow(b, 26, 0, -6, 6, 2.2);
  makeWillow(b, 28, 0, 0, 7, 2.4);
  makeWillow(b, 25, 0, 4, 5, 2);
  makeWillow(b, 29, 0, -10, 6, 2.2);
  makeWillow(b, 27, 0, 8, 6, 2.1);
  makeWillow(b, 31, 0, 3, 5, 1.8);

  /* 10. 灵峰探梅（梅丘） */
  makePlum(b, -28, 4, -16);
  makePlum(b, -30, 4, -14);
  makePlum(b, -26, 4, -18);
  makeBareTree(b, -31, 4, -18);

  /* 11. 曲院风荷（西北湖湾荷塘） */
  const lotusSpots: [number, number][] = [
    [-12, -12], [-15, -15], [-11, -16], [-17, -12],
    [-14, -10], [-18, -16], [-13, -18], [-16, -11]
  ];
  lotusSpots.forEach(([lx, lz], i) => {
    makeLotusLeaf(b, lx, 1, lz, 1.3 + (i % 3) * 0.4);
  });
  makeLotusFlower(b, -13, 1, -13, true);
  makeLotusFlower(b, -16, 1, -14, true);
  makeLotusFlower(b, -14, 1, -17, false);

  /* 12. 花港观鱼池塘装饰 */
  makeRock(b, -15, 0, 22, 1.4);
  makeRock(b, -21, 0, 26, 1.2);
  makePeach(b, -14, 0, 27, 3);
  makePine(b, -22, 0, 22, 5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.set(-18 + Math.cos(a) * 5.5, 0, 24 + Math.sin(a) * 5.5, i % 2 ? PAL.peachDeep : PAL.lotusDeep);
  }

  /* 13. 岸景点缀：石灯笼与湖石 */
  makeLantern(b, -2, 0, 22);
  makeLantern(b, 16, 0, 16);
  makeLantern(b, 22, 0, -14);
  makeRock(b, 20, 0, 10, 1.6);
  makeRock(b, -24, 0, 4, 1.8);
  makeRock(b, 14, 0, -24, 1.4);

  return b;
}

/* ------------------------------------------------------------------ */
/*  场景标记（浮空朱砂印章 + 名称牌）                                   */
/* ------------------------------------------------------------------ */

const SceneMarker: React.FC<{ id: ValidSceneId; pos: [number, number, number] }> = ({ id, pos }) => {
  const { setCurrentScene, collectedStamps } = useWestLakeStore();
  const cubeRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const data = WEST_LAKE_SCENES[id];
  const isStamped = collectedStamps.has(id);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (cubeRef.current) {
      cubeRef.current.rotation.y = t * 0.8 + pos[0];
      cubeRef.current.rotation.x = Math.sin(t * 1.2 + pos[2]) * 0.25;
    }
    if (groupRef.current) {
      groupRef.current.position.y = pos[1] + Math.sin(t * 1.4 + pos[0] * 0.7) * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={pos}>
      {/* 光柱 */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[0.25, 3.5, 0.25]} />
        <meshStandardMaterial
          color={isStamped ? PAL.vermilion : PAL.gold}
          emissive={isStamped ? PAL.vermilion : PAL.gold}
          emissiveIntensity={1.2}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* 浮空印章方块 */}
      <mesh ref={cubeRef} castShadow>
        <boxGeometry args={[1.3, 1.3, 1.3]} />
        <meshStandardMaterial
          color={isStamped ? PAL.vermilion : PAL.goldBright}
          emissive={isStamped ? PAL.vermilion : PAL.gold}
          emissiveIntensity={0.7}
          roughness={0.4}
          flatShading
        />
      </mesh>

      <Html center distanceFactor={55} position={[0, 3.1, 0]} zIndexRange={[40, 0]}>
        <button
          onClick={() => {
            audioManager.playWaterDropSound();
            setCurrentScene(id);
          }}
          className="group flex flex-col items-center cursor-pointer transition-transform duration-300 hover:scale-110 border-none bg-transparent"
        >
          <div
            className={`stamp-seal px-3.5 py-1.5 text-base font-bold shadow-2xl border-2 whitespace-nowrap ${
              isStamped
                ? 'bg-[#B83B32] text-[#F4F1EA] border-[#B83B32]'
                : 'glass-ink-panel text-[#2C2C2C] border-[#C5A55A] group-hover:border-[#B83B32]'
            }`}
          >
            <span className="tracking-widest">{data.name}</span>
          </div>
          <div className="mt-1.5 px-2 py-0.5 text-[10px] tracking-widest font-semibold rounded-full bg-[#1A1A1A]/80 text-[#F4F1EA] border border-[#C5A55A]/40 shadow-lg whitespace-nowrap">
            {data.stampName}
          </div>
        </button>
      </Html>
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  漂移的乌篷船                                                       */
/* ------------------------------------------------------------------ */

const DriftingBoat: React.FC<{ radius: number; phase: number; speed: number; offset: [number, number] }> = ({
  radius, phase, speed, offset
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const boat = useMemo(() => {
    const bb = new VoxelBuilder();
    makeBoat(bb, 0, 0, 0, true);
    return bb;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed + phase;
    if (groupRef.current) {
      const x = offset[0] + Math.cos(t) * radius;
      const z = offset[1] + Math.sin(t) * radius * 0.6;
      groupRef.current.position.set(x, 0.35 + Math.sin(t * 3) * 0.08, z);
      groupRef.current.rotation.y = -t + Math.PI / 2;
    }
  });

  return (
    <group ref={groupRef}>
      <VoxelMesh builder={boat} size={0.8} castShadow />
    </group>
  );
};

/* ------------------------------------------------------------------ */
/*  总览沙盘                                                           */
/* ------------------------------------------------------------------ */

export const OverviewScene: React.FC = () => {
  const { currentScene } = useWestLakeStore();
  const cloudsGroupRef = useRef<THREE.Group>(null!);

  const world = useMemo(() => buildWorld(), []);

  const lakeWaterCells = useMemo(() => lakeCells(LAKE_RX, LAKE_RZ, 0.8), []);
  const pondWaterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -23; x <= -13; x++) {
      for (let z = 19; z <= 29; z++) {
        if ((x + 18) * (x + 18) + (z - 24) * (z - 24) <= 18) out.push([x, z]);
      }
    }
    return out;
  }, []);

  const highClouds = useMemo(() => {
    const b = new VoxelBuilder();
    makeCloud(b, -30, 0, -20, 4);
    makeCloud(b, 25, 2, 15, 5);
    makeCloud(b, 5, 1, 35, 3.5);
    makeCloud(b, -15, 3, 40, 3);
    makeCloud(b, 40, 0, -25, 4.5);
    return b;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.rotation.y = t * 0.008;
      cloudsGroupRef.current.position.y = 30 + Math.sin(t * 0.2) * 1.2;
    }
  });

  if (currentScene !== 'overview') return null;

  return (
    <group>
      {/* 静态体素世界 */}
      <VoxelMesh builder={world} />

      {/* 西湖水面 */}
      <VoxelWater cells={lakeWaterCells} y={0} amplitude={0.26} speed={1} />
      {/* 花港池塘水面 */}
      <VoxelWater cells={pondWaterCells} y={-0.4} amplitude={0.14} speed={1.3} />

      {/* 高空流云 */}
      <group ref={cloudsGroupRef} position={[0, 30, 0]}>
        <VoxelMesh builder={highClouds} castShadow={false} receiveShadow={false} jitter={0.03} />
      </group>

      {/* 湖上乌篷船 */}
      <DriftingBoat radius={12} phase={0} speed={0.05} offset={[4, 2]} />
      <DriftingBoat radius={9} phase={2.1} speed={0.07} offset={[-12, -4]} />
      <DriftingBoat radius={15} phase={4.2} speed={0.04} offset={[8, 8]} />

      {/* 十景地标标记 */}
      {SCENE_MARKERS.map((m) => (
        <SceneMarker key={m.id} id={m.id} pos={m.pos} />
      ))}
    </group>
  );
};
