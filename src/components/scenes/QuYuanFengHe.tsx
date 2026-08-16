import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import {
  makeDioramaBase, makeLotusLeaf, makeLotusFlower, makePavilion, makeRock, makePine
} from '../../voxel/voxelModels';

const R = 24;

export const QuYuanFengHe: React.FC = () => {
  const { currentScene } = useWestLakeStore();
  const { pointer } = useThree();
  const lotusGroupRef = useRef<THREE.Group>(null!);
  const dewRef = useRef<THREE.Mesh>(null!);

  // 基座与岸上庭院
  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => Math.sqrt(x * x + z * z) <= R - 4);
    // 南岸曲院水阁
    b.disk(0, -1, R - 5, 6, PAL.sand, { edgeSkip: 0.2 });
    b.disk(0, 0, R - 5, 5, PAL.grass);
    makePavilion(b, 0, 0, R - 5, 2, PAL.roofDark);
    // 岸边酒坛（赭石堆）
    for (const [jx, jz] of [[-4, R - 5], [4.5, R - 6], [5.5, R - 4]] as [number, number][]) {
      b.set(jx, 0, jz, PAL.wood);
      b.set(jx, 1, jz, PAL.woodDark);
    }
    makeRock(b, -10, -1, R - 6, 1.4);
    makePine(b, 9, 0, R - 6, 5);
    makePine(b, -9, 0, R - 7, 4);
    return b;
  }, []);

  // 荷叶与荷花（整体轻摇）
  const lotus = useMemo(() => {
    const b = new VoxelBuilder();
    const leafSpots: [number, number, number][] = [];
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 15;
      leafSpots.push([Math.cos(a) * r, -0.2 + Math.random() * 0.4, Math.sin(a) * r * 0.8]);
    }
    leafSpots.forEach(([x, y, z], i) => {
      makeLotusLeaf(b, x, y, z, 1.3 + Math.random() * 1.4);
      if (i % 6 === 0) makeLotusFlower(b, x, y, z, Math.random() > 0.3);
    });
    return b;
  }, []);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 3; x <= R - 3; x++) {
      for (let z = -R + 3; z <= R - 3; z++) {
        if (Math.sqrt(x * x + z * z) <= R - 4) out.push([x, z]);
      }
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lotusGroupRef.current) {
      lotusGroupRef.current.rotation.y = Math.sin(t * 0.4) * 0.03;
      lotusGroupRef.current.position.y = Math.sin(t * 1.4) * 0.05;
    }
    // 露珠随鼠标在叶面滚动
    if (dewRef.current) {
      const tx = pointer.x * 9;
      const tz = pointer.y * 7;
      dewRef.current.position.x += (tx - dewRef.current.position.x) * 0.06;
      dewRef.current.position.z += (tz - dewRef.current.position.z) * 0.06;
      dewRef.current.position.y = 0.9 + Math.abs(Math.sin(t * 3)) * 0.15;
    }
  });

  if (currentScene !== 'qu_yuan') return null;

  return (
    <group>
      {/* 盛夏正午光 */}
      <directionalLight position={[18, 40, 12]} color="#FFF6E0" intensity={1.8} castShadow />
      <ambientLight color="#EAF4F0" intensity={0.55} />

      <VoxelMesh builder={world} />
      <VoxelWater cells={waterCells} y={-0.5} amplitude={0.16} speed={0.9} />

      <group ref={lotusGroupRef}>
        <VoxelMesh builder={lotus} />
      </group>

      {/* 晶莹露珠 */}
      <mesh
        ref={dewRef}
        position={[0, 0.9, 0]}
        onPointerOver={() => audioManager.playWaterDropSound()}
      >
        <sphereGeometry args={[0.5, 20, 20]} />
        {/* 不用 transmission（每帧额外渲染整场到折射缓冲，极耗）；普通透明高光即可拟露珠 */}
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.55} roughness={0.05} metalness={0.2} />
      </mesh>

      {/* 荷香浮尘 */}
      <VoxelParticles
        count={220}
        mode="firefly"
        colors={[PAL.lotusPink, PAL.goldBright, '#E8F5E0']}
        bounds={{ x: 0, z: 0, w: 40, h: 7, d: 40, floor: 0.4 }}
        size={0.16}
        emissive
      />
    </group>
  );
};
