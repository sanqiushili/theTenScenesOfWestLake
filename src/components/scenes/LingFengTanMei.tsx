import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { VoxelBuilder, VoxelMesh } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeHill, makePlum, makeBareTree, makeLantern, makePavilion, makeRock } from '../../voxel/voxelModels';

const R = 26;
const PLUM_SPOTS: [number, number][] = [
  [-10, 6], [-4, 9], [2, 7], [8, 10], [13, 5],
  [-14, 1], [-7, 2], [0, 1], [7, 3], [12, -1],
  [-2, 13], [5, 14]
];

export const LingFengTanMei: React.FC = () => {
  const { currentScene } = useWestLakeStore();
  const plumGroupRef = useRef<THREE.Group>(null!);

  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, undefined, { snow: true });
    // 灵峰缓坡
    makeHill(b, 0, -10, 14, 7, { snow: true });
    // 石径灯笼
    for (let z = 18; z >= 2; z -= 5) {
      makeLantern(b, -2, -1, z);
    }
    // 探梅亭
    b.disk(15, -1, 15, 3.4, PAL.snow, { edgeSkip: 0.2 });
    b.disk(15, 0, 15, 2.5, PAL.snowShadow);
    makePavilion(b, 15, 0, 15, 1.5, PAL.roofDark);
    makeRock(b, -18, -1, 12, 1.6);
    makeRock(b, 18, -1, 8, 1.4);
    // 枯木点缀
    makeBareTree(b, -17, -1, -6);
    makeBareTree(b, 17, -1, -8);
    return b;
  }, []);

  // 梅林（整体随寒风轻颤）
  const plum = useMemo(() => {
    const b = new VoxelBuilder();
    PLUM_SPOTS.forEach(([x, z]) => makePlum(b, x, -1, z));
    return b;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (plumGroupRef.current) {
      plumGroupRef.current.rotation.z = Math.sin(t * 1.1) * 0.012;
    }
  });

  if (currentScene !== 'ling_feng') return null;

  return (
    <group>
      {/* 黄昏暖光映雪 */}
      <directionalLight position={[22, 24, 16]} color="#FFC9A0" intensity={1.5} castShadow />
      <ambientLight color="#E8D8E0" intensity={0.5} />

      <VoxelMesh builder={world} />
      <group ref={plumGroupRef}>
        <VoxelMesh builder={plum} />
      </group>

      {/* 梅花瓣随风飘落 */}
      <VoxelParticles
        count={520}
        mode="petal"
        colors={[PAL.plumWhite, PAL.plumPink, '#F8DCE0']}
        bounds={{ x: 0, z: 0, w: 48, h: 16, d: 48, floor: -0.5 }}
        size={0.22}
        speed={0.7}
        mouseVortex
      />

      {/* 暗香浮尘 */}
      <VoxelParticles
        count={120}
        mode="firefly"
        colors={[PAL.plumPink, PAL.goldBright]}
        bounds={{ x: 0, z: 0, w: 40, h: 8, d: 40, floor: 1 }}
        size={0.14}
        emissive
      />
    </group>
  );
};
