import React, { useEffect, useState } from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES } from '../../store/useWestLakeStore';
import { audioManager } from '../../audio/AudioManager';
import { Sparkles, Thermometer, Sun, Bell, Droplets, Wind, Fish, Feather, Flower2, ChevronDown, ChevronUp } from 'lucide-react';

export const PoetryOverlay: React.FC = () => {
  const {
    currentScene,
    collectStamp,
    collectedStamps,
    temperature,
    setTemperature,
    sunProgress,
    setSunProgress,
    cloudFlow,
    setCloudFlow,
    fishFedCount
  } = useWestLakeStore();

  // 诗词卡收起状态；进入新场景时自动展开
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(false);
  }, [currentScene]);

  if (currentScene === 'overview') return null;

  const data = WEST_LAKE_SCENES[currentScene];
  const isStamped = collectedStamps.has(currentScene);

  // 收起态：缩成贴边小胶囊，仅保留展开入口，不遮挡画布交互区
  if (collapsed) {
    return (
      // 左侧垂直居中：避开顶部导航与底部印章坞（移动端印章两行换行后较高）
      <div className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[60] pointer-events-none">
        <button
          onClick={() => {
            audioManager.playWaterDropSound();
            setCollapsed(false);
          }}
          className="glass-ink-panel px-3.5 py-2.5 rounded-full cursor-pointer text-[#2C2C2C] hover:border-[#C5A55A] transition-all shadow-2xl flex items-center gap-2 pointer-events-auto border-2 border-[#C5A55A]/60 bg-[#F4F1EA]/85 backdrop-blur-xl"
          title="展开诗词卡"
        >
          <ChevronUp className="w-4 h-4 text-[#C5A55A]" />
          <span className="text-sm font-bold tracking-widest">{data.name}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 left-3 sm:left-8 z-[60] flex items-center pointer-events-none">
      <div className="glass-ink-panel p-4 sm:p-8 rounded-3xl w-[min(88vw,24rem)] sm:max-w-sm pointer-events-auto shadow-2xl animate-ink-fade relative border-2 border-[#C5A55A]/60 bg-[#F4F1EA]/85 backdrop-blur-xl max-h-[70vh] overflow-y-auto">
        {/* 顶部金边装饰点缀 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#C5A55A] rounded-b" />

        {/* 景点印章与打卡按钮；右侧为收起/展开把手 */}
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 border-b border-[#2C2C2C]/15 pb-3 sm:pb-4">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold tracking-widest text-[#B83B32] uppercase">
              〔 西湖十景 〕
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-widest text-[#2C2C2C] mt-0.5">
              {data.name}
            </h2>
            <p className="text-xs text-[#6B6B6B] tracking-wider mt-0.5 font-sans">
              {data.pinyin}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                audioManager.playStampSound();
                collectStamp(currentScene);
              }}
              className={`stamp-seal px-2.5 sm:px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all duration-300 shadow-md ${
                isStamped
                  ? 'bg-[#B83B32] text-[#F4F1EA] border-[#B83B32] scale-105'
                  : 'bg-[#F4F1EA] text-[#B83B32] hover:bg-[#B83B32] hover:text-[#F4F1EA]'
              }`}
            >
              {isStamped ? '✓ 已印' : `盖印`}
            </button>

            {/* 收起诗词卡：腾出画布操作区，移动端交互必需 */}
            <button
              onClick={() => {
                audioManager.playWaterDropSound();
                setCollapsed((c) => !c);
              }}
              className="glass-ink-panel p-2 rounded-full cursor-pointer text-[#555555] hover:border-[#C5A55A] transition-all"
              title={collapsed ? '展开诗词卡' : '收起诗词卡'}
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 竖排古籍诗词展示区 */}
        <div className="flex justify-between items-start my-4 sm:my-6 bg-[#F4F1EA] p-4 sm:p-6 rounded-2xl border border-[#2C2C2C]/12 shadow-inner relative overflow-hidden">
            {/* 诗名与作者 */}
            <div className="writing-vertical text-xs tracking-[0.3em] text-[#6B6B6B] font-medium h-36 sm:h-48 opacity-90 border-r border-[#2C2C2C]/10 pr-3">
              〔{data.dynasty}〕{data.poet} ·《{data.poem}》
            </div>

            {/* 诗句水墨正文 */}
            <div className="writing-vertical text-base sm:text-lg font-bold tracking-[0.45em] leading-relaxed text-[#2C2C2C] h-36 sm:h-48 pl-2">
              {data.description}
            </div>
        </div>

        {/* 场景专属特色交互面板 */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-[#2C2C2C]/12">
          {currentScene === 'duan_qiao' && (
            <div className="space-y-3 bg-[#F4F1EA] p-3.5 rounded-xl border border-[#2C2C2C]/10">
              <div className="flex items-center justify-between text-xs text-[#2C2C2C]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Thermometer className="w-4 h-4 text-[#B83B32]" />
                  湖畔气温 (融雪微滴着色):
                </span>
                <span className="font-bold text-[#B83B32] text-sm">{temperature}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#B83B32] cursor-pointer"
              />
            </div>
          )}

          {currentScene === 'lei_feng' && (
            <div className="space-y-3 bg-[#F4F1EA] p-3.5 rounded-xl border border-[#2C2C2C]/10">
              <div className="flex items-center justify-between text-xs text-[#2C2C2C]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sun className="w-4 h-4 text-[#C5A55A]" />
                  夕阳沉降 (大气晚霞扩散):
                </span>
                <span className="font-bold text-[#C5A55A] text-sm">
                  {Math.round(sunProgress * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={sunProgress}
                onChange={(e) => setSunProgress(parseFloat(e.target.value))}
                className="w-full accent-[#C5A55A] cursor-pointer"
              />
            </div>
          )}

          {currentScene === 'shuang_feng' && (
            <div className="space-y-3 bg-[#F4F1EA] p-3.5 rounded-xl border border-[#2C2C2C]/10">
              <div className="flex items-center justify-between text-xs text-[#2C2C2C]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Wind className="w-4 h-4 text-[#3B6B5E]" />
                  云海流速 (山岚涌动):
                </span>
                <span className="font-bold text-[#3B6B5E] text-sm">
                  {Math.round(cloudFlow * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={cloudFlow}
                onChange={(e) => setCloudFlow(parseFloat(e.target.value))}
                className="w-full accent-[#3B6B5E] cursor-pointer"
              />
            </div>
          )}

          {currentScene === 'san_tan' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#C5A55A]/15 p-3.5 rounded-xl border border-[#C5A55A]/40 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#C5A55A] shrink-0" />
              <span>点击三座石塔孔洞，可点亮塔内金色烛光，投射水中多重月影。</span>
            </div>
          )}

          {currentScene === 'nan_ping' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#B83B32]/15 p-3.5 rounded-xl border border-[#B83B32]/40 shadow-sm">
              <Bell className="w-5 h-5 text-[#B83B32] shrink-0" />
              <span>点击撞击悬挂的古梵钟，金光震荡扩散并惊飞林间白鹭。</span>
            </div>
          )}

          {currentScene === 'su_di' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#7BA07A]/20 p-3.5 rounded-xl border border-[#7BA07A]/40 shadow-sm">
              <Sparkles className="w-5 h-5 text-[#3B6B5E] shrink-0" />
              <span>滑动鼠标可激起落英旋风，促使 3,000 桃花瓣与柳枝盘旋。</span>
            </div>
          )}

          {currentScene === 'qu_yuan' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#3B6B5E]/15 p-3.5 rounded-xl border border-[#3B6B5E]/40 shadow-sm">
              <Droplets className="w-5 h-5 text-[#3B6B5E] shrink-0" />
              <span>划过荷叶表面，推动晶莹大水珠在叶面滚动融合。</span>
            </div>
          )}

          {currentScene === 'liu_lang' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#F2C94C]/20 p-3.5 rounded-xl border border-[#C5A55A]/50 shadow-sm">
              <Feather className="w-5 h-5 text-[#C5A55A] shrink-0" />
              <span>点击柳林任意处，惊起黄莺穿浪而鸣，柳丝随之翻涌。</span>
            </div>
          )}

          {currentScene === 'ling_feng' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#EFC2C8]/30 p-3.5 rounded-xl border border-[#C45A65]/40 shadow-sm">
              <Flower2 className="w-5 h-5 text-[#C45A65] shrink-0" />
              <span>踏雪寻梅，滑动鼠标卷起暗香花雨，石径灯笼引路。</span>
            </div>
          )}

          {currentScene === 'hua_gang' && (
            <div className="text-xs text-[#2C2C2C] flex items-center gap-2.5 bg-[#F2743C]/15 p-3.5 rounded-xl border border-[#F2743C]/40 shadow-sm">
              <Fish className="w-5 h-5 text-[#F2743C] shrink-0" />
              <span>点击水面投食，锦鲤争跃聚拢（已投食 {fishFedCount} 次）。</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
