import React from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES, ALL_SCENE_IDS } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';

export const StampCollectionDock: React.FC = () => {
  const { currentScene, setCurrentScene, collectedStamps } = useWestLakeStore();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto w-[min(92vw,860px)]">
      <div className="glass-ink-panel px-5 py-3 rounded-3xl flex items-center justify-center gap-2 flex-wrap shadow-2xl">
        <span className="text-xs font-semibold text-[#555555] tracking-widest mr-1 border-r border-[#2C2C2C]/15 pr-3 hidden md:inline">
          游历印痕
        </span>

        {ALL_SCENE_IDS.map((id) => {
          const data = WEST_LAKE_SCENES[id];
          const isStamped = collectedStamps.has(id);
          const isActive = currentScene === id;

          return (
            <button
              key={id}
              onClick={() => {
                audioManager.playWaterDropSound();
                setCurrentScene(id);
              }}
              className={`stamp-seal px-3 py-1 text-xs cursor-pointer transition-all duration-300 ${
                isStamped
                  ? 'bg-[#B83B32] text-[#F4F1EA] border-[#B83B32] shadow-md'
                  : 'bg-[#F4F1EA]/60 text-[#555555] border-dashed border-[#2C2C2C]/30 hover:border-[#B83B32] hover:text-[#B83B32]'
              } ${isActive ? 'ring-2 ring-[#C5A55A] scale-105' : ''}`}
            >
              {/* 与场景标签一致：直接用西湖十景名，不用印章名 */}
              <span className="font-semibold tracking-wider">
                {data.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
