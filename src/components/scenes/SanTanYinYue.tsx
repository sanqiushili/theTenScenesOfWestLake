import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { makeDioramaBase, makeStoneTower, makePavilion, makeRock } from '../../voxel/voxelModels';

const R = 24;
const TOWER_SPOTS: [number, number][] = [
  [-6, 5],
  [6, 5],
  [0, -7]
];

export const SanTanYinYue: React.FC = () => {
  const { currentScene, towersLit, toggleTowerLit } = useWestLakeStore();
  const moonGlowRef = useRef<THREE.Group>(null!);

  // 岛岸基座
  const base = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => Math.sqrt(x * x + z * z) <= R - 2);
    // 东侧赏月台
    b.disk(R - 4, -1, 10, 4, PAL.sand, { edgeSkip: 0.2 });
    b.disk(R - 4, 0, 10, 3, PAL.grass);
    makePavilion(b, R - 4, 0, 10, 1.5, PAL.roofBlue);
    makeRock(b, -(R - 5), -1, -8, 1.6);
    return b;
  }, []);

  // 三座石塔（点亮状态驱动重建）
  const towers = useMemo(() => {
    return TOWER_SPOTS.map(([x, z], i) => {
      const tb = new VoxelBuilder();
      makeStoneTower(tb, 0, 0, 0, towersLit[i]);
      return { builder: tb, x, z };
    });
  }, [towersLit]);

  // 月亮倒影光带
  const moonTrail = useMemo(() => {
    const b = new VoxelBuilder();
    for (let i = 0; i < 26; i++) {
      const t = i / 26;
      const x = -13 + t * 10 + (Math.random() - 0.5) * 2.4;
      const z = -16 + t * 12 + (Math.random() - 0.5) * 2.4;
      b.set(x, -0.2, z, PAL.waterGlow, { emissive: PAL.waterGlow, emissiveIntensity: 1.4 });
    }
    b.disk(-13, -0.2, -16, 2, PAL.waterGlow, { emissive: PAL.moon, emissiveIntensity: 1.8 });
    return b;
  }, []);

  // 像素月亮
  const moon = useMemo(() => {
    const b = new VoxelBuilder();
    for (let x = -3; x <= 3; x++) {
      for (let y = -3; y <= 3; y++) {
        const d = Math.sqrt(x * x + y * y);
        if (d <= 3.2) b.set(x, y, 0, PAL.moon, { emissive: PAL.moon, emissiveIntensity: 1.6 });
      }
    }
    return b;
  }, []);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 2; x <= R - 2; x++) {
      for (let z = -R + 2; z <= R - 2; z++) {
        if (Math.sqrt(x * x + z * z) <= R - 2) out.push([x, z]);
      }
    }
    return out;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (moonGlowRef.current) {
      const s = 1 + Math.sin(t * 1.2) * 0.04;
      moonGlowRef.current.scale.set(s, s, s);
    }
  });

  if (currentScene !== 'san_tan') return null;

  return (
    <group>
      {/* 清冷月光 */}
      <directionalLight position={[24, 40, -26]} color="#C9D6FF" intensity={1.1} castShadow />
      <ambientLight color="#43558C" intensity={0.35} />

      <VoxelMesh builder={base} />
      <VoxelWater
        cells={waterCells}
        y={-0.5}
        amplitude={0.18}
        speed={0.7}
        colors={[PAL.waterDeep, '#24617A', PAL.waterMid]}
      />

      {/* 石塔（点击点亮烛光） */}
      {towers.map((tw, i) => (
        <group
          key={i}
          position={[tw.x, -0.5, tw.z]}
          onClick={(e) => {
            e.stopPropagation();
            audioManager.playWaterDropSound();
            toggleTowerLit(i);
          }}
        >
          <VoxelMesh builder={tw.builder} />
          {towersLit[i] && (
            <>
              <pointLight position={[0, 5, 0]} color={PAL.candle} intensity={5} distance={16} />
              {/* 金色烛光涟漪 */}
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.2, 2.6, 24]} />
                <meshBasicMaterial color={PAL.candle} transparent opacity={0.5} side={THREE.DoubleSide} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {/* 月亮与倒影 */}
      <group position={[-13, 24, -16]}>
        <group ref={moonGlowRef as unknown as React.RefObject<THREE.Group>}>
          <VoxelMesh builder={moon} castShadow={false} receiveShadow={false} jitter={0.02} />
        </group>
        <pointLight color="#FFF6D8" intensity={2.2} distance={70} />
      </group>
      <VoxelMesh builder={moonTrail} castShadow={false} receiveShadow={false} jitter={0.05} />

      {/* 萤火与夜雾微尘 */}
      <VoxelParticles
        count={140}
        mode="firefly"
        colors={[PAL.candle, PAL.goldBright]}
        bounds={{ x: 0, z: 0, w: 40, h: 10, d: 40, floor: 0 }}
        size={0.2}
        emissive
      />
    </group>
  );
};
