import React from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES, TimeOfDay, Season, ALL_SCENE_IDS } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { Volume2, VolumeX, Compass, Calendar, Sun, Moon, Sunrise, Sunset, BookOpen, ChevronLeft } from 'lucide-react';

export const HeaderNavigation: React.FC = () => {
  const {
    currentScene,
    setCurrentScene,
    timeOfDay,
    setTimeOfDay,
    season,
    setSeason,
    isAudioMuted,
    toggleAudioMute,
    setTravelAlbumOpen,
    collectedStamps
  } = useWestLakeStore();

  const times: { id: TimeOfDay; label: string; icon: React.ReactNode }[] = [
    { id: 'dawn', label: '晨雾', icon: <Sunrise className="w-4 h-4" /> },
    { id: 'noon', label: '正午', icon: <Sun className="w-4 h-4" /> },
    { id: 'sunset', label: '斜阳', icon: <Sunset className="w-4 h-4" /> },
    { id: 'night', label: '静夜', icon: <Moon className="w-4 h-4" /> }
  ];

  const seasons: { id: Season; label: string }[] = [
    { id: 'spring', label: '春桃' },
    { id: 'summer', label: '夏荷' },
    { id: 'autumn', label: '秋月' },
    { id: 'winter', label: '冬雪' }
  ];

  // 十景各有专属季节（如断桥残雪只在冬），季节流转仅属于全景总览
  const isOverview = currentScene === 'overview';

  // 时辰也由景致本身决定：如雷峰夕照只能斜阳、三潭印月只能静夜；
  // 仅一个合理时辰的场景直接不展示切换器
  const visibleTimes = isOverview
    ? times
    : times.filter((t) => WEST_LAKE_SCENES[currentScene].allowedTimes.includes(t.id));

  const done = collectedStamps.size;
  const total = ALL_SCENE_IDS.length;

  return (
    <>
      {/* 顶部居中：品牌标题 + 时序控制器 */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[80] w-full flex flex-col items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        <button
          onClick={() => {
            audioManager.playWaterDropSound();
            setCurrentScene('overview');
          }}
          className="pointer-events-auto group flex items-center gap-2 glass-ink-panel px-4 py-2 rounded-full cursor-pointer hover:border-[#C5A55A] transition-all mt-1"
        >
          <Compass className={`w-5 h-5 text-[#C5A55A] group-hover:rotate-45 transition-transform sm:inline-flex ${currentScene !== 'overview' ? 'hidden' : ''}`} />
          {/* 桌面端：始终显示品牌名 */}
          <span className="hidden sm:inline font-semibold text-lg tracking-widest text-[#2C2C2C]">
            西湖十景
          </span>
          {/* 移动端：在景点内时标题变为「返回总览」并带返回箭头 */}
          {currentScene !== 'overview' && (
            <ChevronLeft className="sm:hidden w-4 h-4 text-[#C5A55A]" />
          )}
          <span className="sm:hidden font-semibold text-base tracking-widest text-[#2C2C2C]">
            {currentScene !== 'overview' ? '返回总览' : '西湖十景'}
          </span>
          {/* 桌面端：在景点内时额外显示胶囊提示 */}
          {currentScene !== 'overview' && (
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-[#2C2C2C] text-[#F4F1EA] ml-1">
              返回总览
            </span>
          )}
        </button>

        {/* 时辰（按景致限定）与四季（仅总览）流转控制器，顶部居中第二行 */}
        {visibleTimes.length > 1 && (
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-6 glass-ink-panel px-3 sm:px-6 py-1.5 sm:py-2 rounded-full max-w-[94vw] overflow-x-auto">
            {/* 时辰轮播 */}
            <div
              className={`flex items-center gap-0.5 sm:gap-1 shrink-0 ${
                isOverview ? 'border-r border-[#2C2C2C]/15 pr-2 sm:pr-5' : ''
              }`}
            >
              {visibleTimes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeOfDay(t.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                    timeOfDay === t.id
                      ? 'bg-[#2C2C2C] text-[#F4F1EA] shadow'
                      : 'text-[#555555] hover:text-[#2C2C2C] hover:bg-[#2C2C2C]/5'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* 四季轮播：仅全景总览可见 */}
            {isOverview && (
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Calendar className="w-4 h-4 text-[#7BA07A] mr-0.5 sm:mr-1" />
                {seasons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeason(s.id)}
                    className={`px-2 sm:px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${
                      season === s.id
                        ? 'bg-[#3B6B5E] text-[#F4F1EA] shadow'
                        : 'text-[#555555] hover:text-[#2C2C2C] hover:bg-[#2C2C2C]/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 右下角：声音 + 图册（固定浮钮） */}
      <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => {
            audioManager.playStampSound();
            setTravelAlbumOpen(true);
          }}
          className="relative glass-ink-panel p-3 rounded-full cursor-pointer text-[#B83B32] shadow-lg hover:border-[#C5A55A] hover:scale-105 transition-all"
          title="游历图册"
        >
          <BookOpen className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B83B32] text-[#F4F1EA] text-[10px] font-semibold flex items-center justify-center shadow">
            {done}/{total}
          </span>
        </button>

        <button
          onClick={() => {
            toggleAudioMute();
            audioManager.setMute(!isAudioMuted);
          }}
          className="glass-ink-panel p-3 rounded-full cursor-pointer shadow-lg hover:border-[#C5A55A] hover:scale-105 transition-all text-[#2C2C2C]"
          title={isAudioMuted ? '开启音效' : '静音'}
        >
          {isAudioMuted ? (
            <VolumeX className="w-5 h-5 text-[#B83B32]" />
          ) : (
            <Volume2 className="w-5 h-5 text-[#3B6B5E]" />
          )}
        </button>
      </div>
    </>
  );
};
