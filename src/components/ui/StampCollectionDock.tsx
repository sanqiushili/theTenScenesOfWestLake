import React, { useState } from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES, ALL_SCENE_IDS, SceneId } from '../../store/useWestLakeStore';
import { dailySceneHint } from '../../utils/personalize';
import { audioManager } from '../../audio/AudioManager';
import { Map as MapIcon, X, Compass } from 'lucide-react';

// 小地图景点坐标（按 ALL_SCENE_IDS 顺序，viewBox 0~100，y 向下，近似西湖地理）
const MAP_POS: { x: number; y: number }[] = [
  { x: 47, y: 47 }, // su_di 苏堤春晓（南北长堤，居中）
  { x: 33, y: 28 }, // qu_yuan 曲院风荷（西北岸）
  { x: 54, y: 58 }, // san_tan 三潭印月（湖心偏南）
  { x: 64, y: 22 }, // duan_qiao 断桥残雪（东北里湖）
  { x: 66, y: 64 }, // liu_lang 柳浪闻莺（东南岸）
  { x: 24, y: 42 }, // shuang_feng 双峰插云（西山峰峦）
  { x: 55, y: 82 }, // lei_feng 雷峰夕照（南雷峰塔）
  { x: 70, y: 78 }, // nan_ping 南屏晚钟（东南屏山）
  { x: 15, y: 14 }, // ling_feng 灵峰探梅（西北郊外）
  { x: 42, y: 72 }  // hua_gang 花港观鱼（西南岸）
];

export const StampCollectionDock: React.FC = () => {
  const { currentScene, setCurrentScene, collectedStamps } = useWestLakeStore();
  const [open, setOpen] = useState(false);

  const total = ALL_SCENE_IDS.length;
  const done = collectedStamps.size;
  const pct = Math.round((done / total) * 100);
  const daily = dailySceneHint();

  // 选中景点：跳转 + 收起地图面板（选完即走，少遮挡）
  const go = (id: SceneId) => {
    audioManager.playWaterDropSound();
    setCurrentScene(id);
    setOpen(false);
  };

  return (
    <>
      {/* 收拢态：左下角地图图标 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 left-5 z-[65] pointer-events-auto glass-ink-panel p-3.5 rounded-full cursor-pointer shadow-lg hover:border-[#C5A55A] hover:scale-105 transition-all text-[#2C2C2C]"
        title="景点地图"
      >
        <MapIcon className="w-6 h-6" />
      </button>

      {/* 展开态：小地图选点面板 */}
      {open && (
        <div className="fixed bottom-20 left-5 z-[70] pointer-events-auto w-[min(92vw,320px)] glass-ink-panel rounded-3xl p-4 shadow-2xl animate-ink-fade">
          {/* 关闭 */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-[#2C2C2C]/10 text-[#555555] cursor-pointer"
            title="收起"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 进度条 + 今日宜访（轻互动激励 / 回访钩子） */}
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap pr-6">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-[#555555] tracking-widest shrink-0">
                游历印痕
              </span>
              <div className="w-20 h-2 rounded-full bg-[#2C2C2C]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#B83B32] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[#555555] tracking-wide shrink-0">
                {done}/{total}
                {done === total ? ' · 圆满' : ` · 差${total - done}景`}
              </span>
            </div>

            <button
              onClick={() => go(daily.id)}
              className="flex items-center gap-1 text-xs cursor-pointer text-[#3B6B5E] hover:underline shrink-0"
              title={daily.reason}
            >
              <Compass className="w-3.5 h-3.5" />
              今日宜访 · {daily.name}
            </button>
          </div>

          {/* 西湖小地图：点击景点即刻云游 */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#E8F0EC] border border-[#2C2C2C]/10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 湖面 */}
              <ellipse cx="50" cy="52" rx="40" ry="34" fill="#CFE3E0" stroke="#9FC3BC" strokeWidth="0.6" />
              {/* 苏堤示意线 */}
              <line x1="47" y1="20" x2="47" y2="84" stroke="#A9C9A0" strokeWidth="1.1" strokeDasharray="2 2" opacity="0.7" />
              {/* 景点点 */}
              {ALL_SCENE_IDS.map((id, i) => {
                const p = MAP_POS[i];
                const data = WEST_LAKE_SCENES[id];
                const isStamped = collectedStamps.has(id);
                const isActive = currentScene === id;
                return (
                  <g
                    key={id}
                    onClick={() => go(id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isActive ? 3.4 : 2.6}
                      fill={isStamped ? '#B83B32' : '#F4F1EA'}
                      stroke={isActive ? '#C5A55A' : '#2C2C2C'}
                      strokeWidth={isActive ? 1.4 : 0.8}
                    />
                    <text
                      x={p.x}
                      y={p.y - 4}
                      textAnchor="middle"
                      fontSize="3.4"
                      fill="#2C2C2C"
                      className="select-none"
                    >
                      {data.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="mt-2 text-[10px] text-[#888888] text-center tracking-wide">
            轻点景点，即刻云游
          </p>
        </div>
      )}
    </>
  );
};
