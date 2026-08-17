import React from 'react';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useWestLakeStore } from '../../store/useWestLakeStore';

export const PostProcessingPipeline: React.FC = () => {
  const { timeOfDay } = useWestLakeStore();

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';
  const bloomIntensity = isNight ? 1.15 : isSunset ? 0.95 : 0.5;

  return (
    <EffectComposer enableNormalPass={false} multisampling={4}>
      {/* 体素夜景 / 夕照的柔和泛光 */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={isNight ? 0.5 : 0.78}
        luminanceSmoothing={0.4}
        height={340}
      />
      {/* 去除景深：它会大范围虚化焦外体素（发糊），且是最耗 GPU 的后处理通道；
          光影氛围由阴影贴图 + 泛光 + MSAA 共同保证 */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* 季节氛围不走全屏滤镜：由全景沙盘体素内容直接换装（见 OverviewScene），
          十景子场景保持各自专属季节风貌 */}
      {/* 体素边缘靠 MSAA 4x 保持锐利（比 8x 省一半开销，SMAA 对方块边缘发虚） */}
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
    </EffectComposer>
  );
};
