import React from 'react';
import { useWestLakeStore, TimeOfDay, Season, ALL_SCENE_IDS } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { Volume2, VolumeX, Compass, Calendar, Sun, Moon, Sunrise, Sunset, BookOpen } from 'lucide-react';

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

  return (
    <header className="fixed top-0 left-0 w-full z-[80] px-3 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center md:justify-between gap-2 md:gap-0 pointer-events-auto pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-4">
      {/* 左右两端：品牌 / 图册与音量（移动端分列两侧，中间留给时序控制器） */}
      <div className="w-full md:w-auto flex items-center justify-between md:justify-start md:gap-4">
        <button
          onClick={() => {
            audioManager.playWaterDropSound();
            setCurrentScene('overview');
          }}
          className="group flex items-center gap-2 glass-ink-panel px-3 sm:px-4 py-2 rounded-full cursor-pointer hover:border-[#C5A55A] transition-all"
        >
          <Compass className="w-5 h-5 text-[#C5A55A] group-hover:rotate-45 transition-transform" />
          <span className="font-semibold text-base sm:text-lg tracking-widest text-[#2C2C2C]">
            西湖十景
          </span>
          {currentScene !== 'overview' && (
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-[#2C2C2C] text-[#F4F1EA] ml-1">
              返回总览
            </span>
          )}
        </button>

        {/* 移动端：图册与音量靠右（桌面端在下方独立区域） */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => {
              audioManager.playStampSound();
              setTravelAlbumOpen(true);
            }}
            className="glass-ink-panel p-2.5 rounded-full cursor-pointer text-[#B83B32]"
            title="游历图册"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              toggleAudioMute();
              audioManager.setMute(!isAudioMuted);
            }}
            className="glass-ink-panel p-2.5 rounded-full cursor-pointer text-[#2C2C2C]"
            title={isAudioMuted ? '开启音效' : '静音'}
          >
            {isAudioMuted ? <VolumeX className="w-5 h-5 text-[#B83B32]" /> : <Volume2 className="w-5 h-5 text-[#3B6B5E]" />}
          </button>
        </div>
      </div>

      {/* 中间：时辰与四季无缝流转控制器（移动端为紧凑第二行，功能完整保留） */}
      <div className="flex items-center gap-2 sm:gap-6 glass-ink-panel px-3 sm:px-6 py-1.5 sm:py-2 rounded-full max-w-full overflow-x-auto">
        {/* 时辰轮播 */}
        <div className="flex items-center gap-0.5 sm:gap-1 border-r border-[#2C2C2C]/15 pr-2 sm:pr-5 shrink-0">
          {times.map((t) => (
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

        {/* 四季轮播 */}
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
      </div>

      {/* 右侧：导出图册与音量控制（桌面端） */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => {
            audioManager.playStampSound();
            setTravelAlbumOpen(true);
          }}
          className="flex items-center gap-2 stamp-seal px-4 py-2 text-sm font-semibold cursor-pointer shadow-md bg-[#F4F1EA]"
        >
          <BookOpen className="w-4 h-4 text-[#B83B32]" />
          <span>游历图册 ({collectedStamps.size}/{ALL_SCENE_IDS.length})</span>
        </button>

        <button
          onClick={() => {
            toggleAudioMute();
            audioManager.setMute(!isAudioMuted);
          }}
          className="glass-ink-panel p-2.5 rounded-full cursor-pointer hover:border-[#C5A55A] transition-all text-[#2C2C2C]"
          title={isAudioMuted ? '开启音效' : '静音'}
        >
          {isAudioMuted ? (
            <VolumeX className="w-5 h-5 text-[#B83B32]" />
          ) : (
            <Volume2 className="w-5 h-5 text-[#3B6B5E]" />
          )}
        </button>
      </div>
    </header>
  );
};
