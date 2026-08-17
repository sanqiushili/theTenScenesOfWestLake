import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

// 3D Canvas 组件
import { CameraRig } from './components/canvas/CameraRig';
import { OverviewScene } from './components/canvas/OverviewScene';
import { VoxelSky } from './components/canvas/VoxelSky';
import { PostProcessingPipeline } from './components/canvas/PostProcessingPipeline';
import { SeasonParticles } from './components/canvas/SeasonParticles';

// 西湖十景体素场景
import { SuDiChunXiao } from './components/scenes/SuDiChunXiao';
import { QuYuanFengHe } from './components/scenes/QuYuanFengHe';
import { SanTanYinYue } from './components/scenes/SanTanYinYue';
import { DuanQiaoCanXue } from './components/scenes/DuanQiaoCanXue';
import { LiuLangWenYing } from './components/scenes/LiuLangWenYing';
import { ShuangFengChaYun } from './components/scenes/ShuangFengChaYun';
import { LeiFengXiZhao } from './components/scenes/LeiFengXiZhao';
import { NanPingWanZhong } from './components/scenes/NanPingWanZhong';
import { LingFengTanMei } from './components/scenes/LingFengTanMei';
import { HuaGangGuanYu } from './components/scenes/HuaGangGuanYu';

// 2D UI 浮层组件
import { HeaderNavigation } from './components/ui/HeaderNavigation';
import { PoetryOverlay } from './components/ui/PoetryOverlay';
import { StampCollectionDock } from './components/ui/StampCollectionDock';
import { TravelAlbumModal } from './components/ui/TravelAlbumModal';

/**
 * 阴影节流器：场景里投影来源几乎静态（只有缓行的乌篷船与摇曳树冠），
 * 改为按需更新、每 3 帧刷一次阴影贴图，省掉约 1/3 的几何绘制开销。
 */
const ShadowUpdateThrottle: React.FC = () => {
  const { gl } = useThree();
  const frameRef = useRef(0);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  useFrame(() => {
    frameRef.current += 1;
    if (frameRef.current % 3 === 0) gl.shadowMap.needsUpdate = true;
  });

  return null;
};

export const App: React.FC = () => {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F4F1EA]">
      {/* 2D 页面层 UI */}
      <HeaderNavigation />
      <PoetryOverlay />
      <StampCollectionDock />
      <TravelAlbumModal />

      {/* 3D 体素 WebGL 渲染层 */}
      <Canvas
        shadows
        dpr={[1, 2]}
        // preserveDrawingBuffer：盖印即拍照，需随时截取含后处理的最终帧
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [0, 46, 66], fov: 50, near: 0.5, far: 600 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* 昼夜全局光照 / 天空 / 雾 / 星辰 */}
        <VoxelSky />

        {/* 阴影贴图按需刷新，降低持续 GPU 负载 */}
        <ShadowUpdateThrottle />

        {/* 摄像机运镜 + 轨道控制 */}
        <CameraRig />

        <Suspense fallback={null}>
          {/* 体素西湖总览沙盘 */}
          <OverviewScene />

          {/* 西湖十景体素微缩景观 */}
          <SuDiChunXiao />
          <QuYuanFengHe />
          <SanTanYinYue />
          <DuanQiaoCanXue />
          <LiuLangWenYing />
          <ShuangFengChaYun />
          <LeiFengXiZhao />
          <NanPingWanZhong />
          <LingFengTanMei />
          <HuaGangGuanYu />

          {/* 全局季节粒子：桃花瓣 / 萤点 / 落叶 / 飞雪 */}
          <SeasonParticles />

          {/* 后处理管线 */}
          <PostProcessingPipeline />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;
