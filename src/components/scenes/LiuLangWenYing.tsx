import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeWillowCrown, makeRock, makeLantern, makePavilion, createFlock } from '../../voxel/voxelModels';

const R = 26;
const TREE_SPOTS: [number, number, number][] = [
  [-12, 4, 1.9], [-6, 8, 2.3], [0, 3, 2.1], [6, 9, 2.4], [12, 5, 2.0],
  [-9, -2, 1.8], [3, -3, 2.2], [10, -1, 1.9], [-3, 12, 2.0], [8, 14, 1.8]
];

export const LiuLangWenYing: React.FC = () => {
  const { currentScene } = useWestLakeStore();
  const crownRefs = useRef<(THREE.Group | null)[]>([]);
  const startleRef = useRef(0);
  const flock = useMemo(() => createFlock(14, new THREE.Vector3(0, 8, 4), 12, PAL.oriole), []);

  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => z <= -14 && Math.sqrt(x * x + z * z) <= R - 2);
    // 柳树干
    TREE_SPOTS.forEach(([x, z], i) => {
      const h = 5 + (i % 3);
      for (let yy = 0; yy < h; yy++) b.set(x, yy, z, yy < 2 ? PAL.woodDark : PAL.wood);
    });
    // 湖畔小亭与石灯笼
    b.disk(-16, -1, -10, 3.4, PAL.sand, { edgeSkip: 0.2 });
    b.disk(-16, 0, -10, 2.5, PAL.grass);
    makePavilion(b, -16, 0, -10, 1.5, PAL.roofDark);
    makeLantern(b, 14, -1, 10);
    makeLantern(b, -14, -1, 8);
    makeRock(b, 17, -1, 2, 1.5);
    return b;
  }, []);

  const crowns = useMemo(() => {
    return TREE_SPOTS.map(([x, z, r]) => {
      const cb = new VoxelBuilder();
      makeWillowCrown(cb, r);
      return { builder: cb, x, z };
    });
  }, []);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 2; x <= R - 2; x++) {
      for (let z = -R + 2; z <= -14; z++) {
        if (Math.sqrt(x * x + z * z) <= R - 2) out.push([x, z]);
      }
    }
    return out;
  }, []);

  useEffect(() => () => { flock.mesh.dispose(); flock.mesh.geometry.dispose(); }, [flock]);

  const startle = () => {
    startleRef.current = 1;
    audioManager.playChirpSound();
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    crowns.forEach((_, i) => {
      const g = crownRefs.current[i];
      if (g) {
        g.rotation.z = Math.sin(t * 1.6 + i) * 0.11;
        g.rotation.x = Math.cos(t * 1.2 + i * 0.8) * 0.08;
      }
    });
    startleRef.current = Math.max(0, startleRef.current - 0.004);
    flock.update(t, 0.016, startleRef.current);
  });

  if (currentScene !== 'liu_lang') return null;

  return (
    <group>
      {/* 隐形拾取盒：点击任意处惊起黄莺。单个盒子代替整场景挂 onClick，
          避免每次鼠标移动都对上万个实例体素做射线检测 */}
      <mesh visible={false} position={[0, 8, 0]} onClick={startle}>
        <boxGeometry args={[54, 30, 54]} />
      </mesh>

      {/* 清晨柔光 */}
      <directionalLight position={[20, 30, 20]} color="#FFE9C4" intensity={1.6} castShadow />
      <ambientLight color="#E8F0D8" intensity={0.5} />

      <VoxelMesh builder={world} />
      <VoxelWater cells={waterCells} y={-0.6} amplitude={0.2} speed={0.9} />

      {/* 摇曳柳冠 */}
      {crowns.map((c, i) => {
        const spot = TREE_SPOTS[i];
        return (
          <group
            key={i}
            ref={(el) => { crownRefs.current[i] = el; }}
            position={[c.x, 5 + (i % 3) + 1.5, c.z]}
          >
            <VoxelMesh builder={c.builder} castShadow />
          </group>
        );
      })}

      {/* 黄莺 */}
      <primitive object={flock.mesh} />

      {/* 柳絮飞花 */}
      <VoxelParticles
        count={320}
        mode="leaf"
        colors={[PAL.willow, PAL.willowDark, '#DCE8B8']}
        bounds={{ x: 0, z: 0, w: 46, h: 14, d: 46, floor: 0 }}
        size={0.2}
        speed={0.8}
        mouseVortex
      />
    </group>
  );
};
