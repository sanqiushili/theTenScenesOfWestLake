import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { VoxelBuilder, VoxelMesh } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeHill, makeCloud, makePine, makeRock } from '../../voxel/voxelModels';

const R = 26;

export const ShuangFengChaYun: React.FC = () => {
  const { currentScene, cloudFlow } = useWestLakeStore();
  const bandARef = useRef<THREE.Group>(null!);
  const bandBRef = useRef<THREE.Group>(null!);

  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R);
    // 北高峰 / 南高峰
    makeHill(b, -10, -2, 8, 21);
    makeHill(b, 10, -2, 8, 23);
    // 峰顶小金刹
    b.disk(-10, 21, -2, 2, PAL.pathStone);
    b.set(-10, 22, -2, PAL.vermilion);
    b.set(-10, 23, -2, PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.8 });
    b.disk(10, 23, -2, 2, PAL.pathStone);
    b.set(10, 24, -2, PAL.vermilion);
    b.set(10, 25, -2, PAL.gold, { emissive: PAL.gold, emissiveIntensity: 0.8 });
    // 山脚松石
    makePine(b, -19, 0, 8, 6);
    makePine(b, 19, 0, 8, 7);
    makePine(b, 0, 0, 14, 5);
    makeRock(b, -4, 0, 16, 1.6);
    makeRock(b, 5, 0, 15, 1.3);
    return b;
  }, []);

  // 前层云海（宽幅以便无缝循环）
  const bandA = useMemo(() => {
    const b = new VoxelBuilder();
    for (let i = 0; i < 10; i++) {
      const x = -55 + i * 12 + Math.random() * 4;
      makeCloud(b, x, 0, -2 + Math.random() * 6, 2.4 + Math.random() * 1.6, PAL.mist);
    }
    return b;
  }, []);

  // 后层云海
  const bandB = useMemo(() => {
    const b = new VoxelBuilder();
    for (let i = 0; i < 10; i++) {
      const x = -55 + i * 12 + Math.random() * 4;
      makeCloud(b, x, 0, -6 + Math.random() * 4, 3 + Math.random() * 2, PAL.cloud);
    }
    return b;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speedA = 1.2 + cloudFlow * 4.5;
    const speedB = 0.7 + cloudFlow * 2.8;
    if (bandARef.current) {
      bandARef.current.position.x = ((t * speedA + 30) % 60) - 30;
      bandARef.current.position.y = 12 + Math.sin(t * 0.5) * 0.6;
    }
    if (bandBRef.current) {
      bandBRef.current.position.x = 30 - ((t * speedB + 30) % 60);
      bandBRef.current.position.y = 17 + Math.cos(t * 0.4) * 0.7;
    }
  });

  if (currentScene !== 'shuang_feng') return null;

  return (
    <group>
      {/* 高空清光 */}
      <directionalLight position={[0, 40, 30]} color="#EAF2F8" intensity={1.7} castShadow />
      <ambientLight color="#DCE8F0" intensity={0.6} />

      <VoxelMesh builder={world} />

      {/* 流动云海 */}
      <group ref={bandARef} position={[0, 12, 2]}>
        <VoxelMesh builder={bandA} castShadow={false} receiveShadow={false} jitter={0.02} />
      </group>
      <group ref={bandBRef} position={[0, 17, -4]}>
        <VoxelMesh builder={bandB} castShadow={false} receiveShadow={false} jitter={0.02} />
      </group>

      {/* 山岚雾霭 */}
      <VoxelParticles
        count={320}
        mode="firefly"
        colors={[PAL.mist, PAL.cloud]}
        bounds={{ x: 0, z: 0, w: 50, h: 20, d: 40, floor: 8 }}
        size={0.3}
      />
    </group>
  );
};
