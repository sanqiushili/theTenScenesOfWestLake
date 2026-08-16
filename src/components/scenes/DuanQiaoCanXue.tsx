import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useWestLakeStore } from '../../store/useWestLakeStore';
import { VoxelBuilder, VoxelMesh, VoxelWater } from '../../voxel/VoxelKit';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import {
  makeDioramaBase, makeArchBridge, makeBareTree, makeHill, makePavilion, makeLantern, makeRock
} from '../../voxel/voxelModels';

const R = 24;

/** 简单可复现乱序 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const DuanQiaoCanXue: React.FC = () => {
  const { currentScene, temperature } = useWestLakeStore();

  // 雪原基座 + 石桥 + 背景
  const world = useMemo(() => {
    const b = new VoxelBuilder();
    makeDioramaBase(b, R, (x, z) => Math.abs(z) <= 7 && Math.sqrt(x * x + z * z) <= R - 2, { snow: true });

    // 断桥（沿 x 拱起）
    makeArchBridge(b, 0, 0, 'x', 21, 3, 4, PAL.pathStone, PAL.wallWhite, 0);

    // 远山积雪
    makeHill(b, -17, -17, 7, 8, { snow: true });
    makeHill(b, 15, -19, 6, 7, { snow: true });
    makeHill(b, 20, 15, 5, 5, { snow: true });

    // 枯木与亭
    makeBareTree(b, -13, -1, 10);
    makeBareTree(b, 12, -1, -11);
    makeBareTree(b, -16, -1, -9);
    makeBareTree(b, 16, -1, 11);
    makePavilion(b, 14, -1, 14, 1.5, PAL.roofDark);
    makeLantern(b, -6, -1, 9);
    makeLantern(b, 7, -1, -9);
    makeRock(b, -11, -1, -12, 1.5);
    return b;
  }, []);

  // 桥面残雪：候选雪块按固定乱序排好，温度越高存留越少（背阴面优先保留）
  const snowCandidates = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let x = -10; x <= 10; x++) {
      const t = (x + 10) / 20;
      const deckY = Math.round(Math.sin(t * Math.PI) * 4);
      for (const z of [-1, 0, 1]) {
        // 背阴面（z<0）雪更厚
        const layers = z < 0 ? 2 : 1;
        for (let l = 0; l < layers; l++) {
          list.push([x, deckY + 1 + l, z]);
        }
      }
    }
    // 先按向阳面优先融化排序：z>0 的先消失 → 用权重乱序
    return seededShuffle(list, 7)
      .sort((a, bb) => (a[2] > 0 ? -1 : 1) - (bb[2] > 0 ? -1 : 1) + (Math.random() - 0.5) * 0.4);
  }, []);

  // 温度量化后重建雪层
  const tempLevel = Math.round(temperature * 2);
  const snowLayer = useMemo(() => {
    const meltRatio = temperature / 15;
    const keep = Math.floor(snowCandidates.length * Math.max(0, 1 - meltRatio * 1.15));
    const b = new VoxelBuilder();
    snowCandidates.slice(0, keep).forEach(([x, y, z]) => {
      b.set(x, y, z, Math.random() > 0.15 ? PAL.snow : PAL.snowShadow);
    });
    return b;
  }, [snowCandidates, temperature, tempLevel]);

  const waterCells = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = -R + 2; x <= R - 2; x++) {
      for (let z = -7; z <= 7; z++) {
        if (Math.sqrt(x * x + z * z) <= R - 2) out.push([x, z]);
      }
    }
    return out;
  }, []);

  if (currentScene !== 'duan_qiao') return null;

  return (
    <group>
      {/* 冷冽晨光 */}
      <directionalLight position={[24, 30, 18]} color="#DCE8F2" intensity={1.4} castShadow />
      <ambientLight color="#B8CCE0" intensity={0.5} />

      <VoxelMesh builder={world} />
      <VoxelMesh builder={snowLayer} castShadow={false} />
      <VoxelWater
        cells={waterCells}
        y={-0.6}
        amplitude={0.14}
        speed={0.6}
        colors={['#28506B', '#3A6B84', '#5D93A8']}
      />

      {/* 落雪 */}
      <VoxelParticles
        count={Math.floor(840 - temperature * 36)}
        mode="snow"
        colors={[PAL.snow, '#E6EEF4']}
        bounds={{ x: 0, z: 0, w: 52, h: 24, d: 52, floor: -0.8 }}
        size={0.22}
        speed={1}
      />
    </group>
  );
};
