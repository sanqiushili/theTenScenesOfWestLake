import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import {
  makeDioramaBase, makePeach, makePavilion, makeArchBridge, makeWillowCrown, makeCloud, makeRock
} from '../../voxel/voxelModels';

const R = 26;

export const SuDiChunXiao: React.FC = () => {
  const { currentScene } = useWestLakeStore();
  const crownRefs = useRef<(THREE.Group | null)[]>([]);
  const mistRef = useRef<THREE.Group>(null!);

  // 静态堤岸世界
  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => {
      const d = Math.sqrt(x * x + z * z);
      return d <= R - 2 && Math.abs(x) > 3; // 堤两侧皆湖
    });

    // 苏堤长堤
    for (let z = -24; z <= 24; z++) {
      for (const w of [-1, 0, 1]) {
        b.set(w, 0, z, w === 0 ? PAL.sand : PAL.grassDark);
        if (Math.abs(w) === 1) b.set(w, -1, z, PAL.dirt);
      }
    }
    // 映澜拱桥
    makeArchBridge(b, 0, 0, 'z', 9, 3, 3, PAL.pathStone, PAL.wallWhite, 0);
    makeArchBridge(b, 0, -16, 'z', 5, 3, 2, PAL.pathStone, PAL.wallWhite, 0);

    // 桃柳相间（树干入静态层，柳冠独立摇曳）
    const treeRows = [-21, -16, -11, -6, 4, 9, 14, 19];
    treeRows.forEach((z, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      // 柳树干
      for (let h = 0; h < 5; h++) b.set(side * 3, h, z, h < 2 ? PAL.woodDark : PAL.wood);
      // 另一侧桃树
      makePeach(b, -side * 3, 0, z + 2, 4);
    });

    // 湖心春晓亭小岛
    b.disk(13, -1, -6, 3.6, PAL.sand, { edgeSkip: 0.15 });
    b.disk(13, 0, -6, 2.6, PAL.grass);
    makePavilion(b, 13, 0, -6, 1.5);

    makeRock(b, -12, -1, 10, 1.6);
    makeRock(b, 10, -1, 16, 1.3);
    return b;
  }, []);

  // 柳冠（每棵独立 group 摇曳）
  const crowns = useMemo(() => {
    const treeRows = [-21, -16, -11, -6, 4, 9, 14, 19];
    return treeRows.map((z, i) => {
      const cb = new VoxelBuilder();
      makeWillowCrown(cb, 2.1);
      return { builder: cb, side: i % 2 === 0 ? -1 : 1, z };
    });
  }, []);

  // 晨雾团
  const mist = useMemo(() => {
    const b = new VoxelBuilder();
    makeCloud(b, -8, 0, 8, 3);
    makeCloud(b, 10, 0.5, -12, 3.5);
    makeCloud(b, -14, 0.2, -8, 2.5);
    makeCloud(b, 15, 0, 10, 2.8);
    return b;
  }, []);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 2; x <= R - 2; x++) {
      for (let z = -R + 2; z <= R - 2; z++) {
        const d = Math.sqrt(x * x + z * z);
        if (d <= R - 2 && Math.abs(x) > 2) out.push([x, z]);
      }
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    crowns.forEach((_, i) => {
      const g = crownRefs.current[i];
      if (g) {
        g.rotation.z = Math.sin(t * 1.5 + i * 0.9) * 0.09;
        g.rotation.x = Math.cos(t * 1.1 + i * 0.7) * 0.07;
      }
    });
    if (mistRef.current) {
      mistRef.current.position.x = Math.sin(t * 0.1) * 6;
      mistRef.current.position.z = Math.cos(t * 0.07) * 4;
    }
  });

  if (currentScene !== 'su_di') return null;

  return (
    <group>
      {/* 破晓暖光 */}
      <directionalLight position={[30, 26, 16]} color="#FFC182" intensity={1.5} castShadow />
      <ambientLight color="#FFE9D2" intensity={0.4} />

      <VoxelMesh builder={world} />
      <VoxelWater cells={waterCells} y={-0.6} amplitude={0.22} speed={0.9} />

      {/* 摇曳柳冠 */}
      {crowns.map((c, i) => (
        <group
          key={i}
          ref={(el) => { crownRefs.current[i] = el; }}
          position={[c.side * 3, 5.5, c.z]}
        >
          <VoxelMesh builder={c.builder} castShadow />
        </group>
      ))}

      {/* 晨雾 */}
      <group ref={mistRef} position={[0, 1.5, 0]}>
        <VoxelMesh builder={mist} castShadow={false} receiveShadow={false} jitter={0.02} />
      </group>

      {/* 落英桃花瓣（鼠标可卷起旋风） */}
      <VoxelParticles
        count={800}
        mode="petal"
        colors={[PAL.peachPink, PAL.peachDeep, '#FBD3DC']}
        bounds={{ x: 0, z: 0, w: 46, h: 18, d: 46, floor: -0.5 }}
        size={0.26}
        speed={1}
        mouseVortex
      />
    </group>
  );
};
