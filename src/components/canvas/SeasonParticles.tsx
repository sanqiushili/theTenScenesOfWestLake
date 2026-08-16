import React from 'react';
import { VoxelParticles } from '../../voxel/VoxelParticles';
import { PAL } from '../../voxel/palette';
import { useWestLakeStore, Season } from '../../store/useWestLakeStore';

/**
 * 全局季节粒子：随顶部季节切换在整个西湖沙盘上空飘落，
 * 总览与十景子场景都能感受到季节氛围。
 * 数量控制在 300 以内，与场景自身粒子叠加后仍是轻量级。
 */
const SEASON_PARTICLES: Record<
  Season,
  { mode: 'petal' | 'firefly' | 'leaf' | 'snow'; colors: string[]; size: number; speed: number }
> = {
  // 春：桃花瓣纷纷
  spring: { mode: 'petal', colors: [PAL.peachPink, PAL.peachDeep, PAL.plumPink], size: 0.24, speed: 0.9 },
  // 夏：水泽浮光萤点
  summer: { mode: 'firefly', colors: [PAL.goldBright, PAL.waterGlow], size: 0.16, speed: 0.8 },
  // 秋：赭金落叶
  autumn: { mode: 'leaf', colors: [PAL.gold, '#C96F3B', '#A8542F'], size: 0.26, speed: 1 },
  // 冬：漫天飞雪（稍大一号，总览俯看距离下才清晰可辨）
  winter: { mode: 'snow', colors: [PAL.snow, PAL.snowShadow, '#FFFFFF'], size: 0.3, speed: 1.1 }
};

export const SeasonParticles: React.FC = () => {
  const season = useWestLakeStore((s) => s.season);
  const cfg = SEASON_PARTICLES[season];

  return (
    <VoxelParticles
      // 季节切换时整体重挂载，粒子从新分布开始，避免旧粒子残留错季
      key={season}
      count={300}
      mode={cfg.mode}
      colors={cfg.colors}
      size={cfg.size}
      speed={cfg.speed}
      mouseVortex={cfg.mode !== 'snow'}
      emissive={cfg.mode === 'firefly'}
      bounds={{ x: 0, z: 0, w: 76, h: 32, d: 76, floor: 1 }}
    />
  );
};
