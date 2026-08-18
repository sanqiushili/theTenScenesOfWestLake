import React, { useEffect, useState, useRef } from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES } from '../../store/useWestLakeStore';
import { AliasModal } from './AliasModal';
import { audioManager } from '../../audio/AudioManager';
import { captureScenePhotoWithRetry, composeStampedPhoto } from '../../utils/scenePhoto';
import { Sparkles, Thermometer, Sun, Bell, Droplets, Wind, Fish, Feather, Flower2, ChevronDown, ChevronUp, X, Download, Send } from 'lucide-react';

export const PoetryOverlay: React.FC = () => {
  const {
    currentScene,
    collectStamp,
    collectedStamps,
    userAlias,
    aliasSet,
    setUserAlias,
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
  // 盖印即拍照：快门闪光与拍摄中态
  const [flash, setFlash] = useState(false);
  const [shooting, setShooting] = useState(false);
  // 盖印后当场晒出的拍立得明信片（含印章），几秒后自动收起
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [photoTip, setPhotoTip] = useState('');
  // 全屏放大查看明信片 + 保存
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [savedTip, setSavedTip] = useState('');
  const [saving, setSaving] = useState(false);
  // 首次盖印题名弹窗
  const [showAliasModal, setShowAliasModal] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 轮询检测小红书 SDK 注入（与 TravelAlbumModal 同一逻辑）
  const [bridgeReady, setBridgeReady] = useState(false);
  const isTouchWebView =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0);

  useEffect(() => {
    if (bridgeReady) return;
    const check = () => {
      const mt = (window as any).xhs?.miniTool;
      return !!(mt && typeof mt.saveImageToPhotosAlbum === 'function');
    };
    if (check()) { setBridgeReady(true); return; }
    const iv = setInterval(() => {
      if (check()) { setBridgeReady(true); clearInterval(iv); }
    }, 200);
    const to = setTimeout(() => clearInterval(iv), 5000);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [bridgeReady]);

  const showTip = (msg: string) => {
    setSavedTip(msg);
    setTimeout(() => setSavedTip(''), 2500);
  };

  // 大图 base64 先 writeTempFile 落文件再传，避免超长 base64 上行
  const toTempFile = async (mt: any, dataUrl: string): Promise<string> => {
    if (typeof mt?.writeTempFile === 'function') {
      try {
        const res = await mt.writeTempFile({ data: dataUrl });
        if (res?.filePath) return res.filePath;
      } catch { /* 回退直传 dataURL */ }
    }
    return dataUrl;
  };

  // 保存单张明信片到相册 / 发笔记（与图册保存同一 JSAPI 链路）
  const savePhoto = async () => {
    if (!fullscreenPhoto || saving) return;
    const mt = (window as any).xhs?.miniTool;
    if (mt && typeof mt.saveImageToPhotosAlbum === 'function') {
      setSaving(true);
      try {
        const filePath = await toTempFile(mt, fullscreenPhoto);
        await mt.saveImageToPhotosAlbum({ filePath });
        showTip('已存入系统相册 ✓');
      } catch (err: any) {
        showTip(err?.errMsg ? '保存失败，请检查相册权限' : '保存失败，请重试');
      } finally {
        setSaving(false);
      }
      return;
    }
    // 普通移动端 WebView：提示长按图片保存
    if (isTouchWebView) {
      showTip('长按上方图片，选择「保存图片」');
      return;
    }
    // 桌面下载
    const a = document.createElement('a');
    a.href = fullscreenPhoto;
    a.download = `${data.name}_明信片_${Date.now()}.jpg`;
    a.click();
  };

  const sharePhotoAsNote = async () => {
    if (!fullscreenPhoto || saving) return;
    const mt = (window as any).xhs?.miniTool;
    if (!mt || typeof mt.postNote !== 'function') return;
    setSaving(true);
    try {
      const imgUrl = await toTempFile(mt, fullscreenPhoto);
      await mt.postNote({
        title: data.name,
        content: `我是「${userAlias}」，在西湖十景·${data.name}盖印留影，落印为记。`,
        tags: '#西湖十景 #数字艺术 #水墨',
        mediaInfo: { image_resources: [{ url: imgUrl }] }
      });
    } catch {
      showTip('未能唤起发布页，请重试');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setCollapsed(false);
  }, [currentScene]);
  useEffect(() => () => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
  }, []);

  if (currentScene === 'overview') return null;

  const data = WEST_LAKE_SCENES[currentScene];
  const isStamped = collectedStamps.has(currentScene);

  // 盖印即拍照：抓下用户当前调好的视角，装裱成拍立得收入图册，
  // 并当场晒出给用户确认；已盖印再按一次即重拍覆盖
  const doStamp = async () => {
    if (shooting) return;
    setShooting(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 220);
    audioManager.playStampSound();
    // 黑帧防护：渲染未就绪时等下一帧重试
    const raw = await captureScenePhotoWithRetry();
    if (!raw) {
      setShooting(false);
      setPhotoTip('画面尚未就绪，请稍后再按一次');
      setTimeout(() => setPhotoTip(''), 2600);
      return;
    }
    const photo = await composeStampedPhoto(raw, data, userAlias).catch(() => raw);
    collectStamp(currentScene, photo);
    setPreviewPhoto(photo);
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreviewPhoto(null), 7000);
    setShooting(false);
  };

  // 首次盖印先题名：把身份落进明信片，再真正盖印
  const handleStamp = () => {
    if (!aliasSet) {
      setShowAliasModal(true);
      return;
    }
    doStamp();
  };

  const handleAliasConfirm = (alias: string) => {
    setUserAlias(alias);
    setShowAliasModal(false);
    doStamp();
  };

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
    <>
    {/* 快门闪光：盖印瞬间白幕一闪即收 */}
    {flash && (
      <div className="fixed inset-0 z-[95] bg-white pointer-events-none animate-shutter-flash" />
    )}

    {/* 盖印后当场晒出的拍立得：印章压在照片上，给用户明确的"拍到了"认知；点击放大查看并保存 */}
    {previewPhoto && (
      <div className="fixed right-2 sm:right-8 top-[16%] sm:top-1/2 z-[70] pointer-events-none animate-postcard-in">
        <div className="relative w-36 sm:w-60 rotate-2 pointer-events-auto">
          {/* 和纸胶带 */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 sm:w-24 h-4 sm:h-5 bg-[#C5A55A]/45 -rotate-3 rounded-[2px] z-10 shadow-sm" />
          <img
            src={previewPhoto}
            alt={`${data.name} 游历明信片`}
            className="w-full block rounded-[3px] shadow-2xl border border-[#2C2C2C]/15 cursor-pointer hover:brightness-105 transition-all"
            onClick={() => {
              setFullscreenPhoto(previewPhoto);
              if (previewTimer.current) clearTimeout(previewTimer.current);
            }}
          />
          <button
            onClick={() => {
              setPreviewPhoto(null);
              if (previewTimer.current) clearTimeout(previewTimer.current);
            }}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-[#2C2C2C]/70 text-[#F4F1EA] cursor-pointer hover:bg-[#2C2C2C] transition-colors z-10"
            title="收起照片"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="mt-2 text-center text-[10px] sm:text-xs text-[#555555] tracking-widest">
            点击放大查看 · 可保存 · 再按可重拍
          </p>
        </div>
      </div>
    )}

    {/* 全屏放大查看明信片 + 保存到相册 / 发笔记 */}
    {fullscreenPhoto && (
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 bg-[#1A1A1A]/85 backdrop-blur-md p-4 animate-ink-fade">
        {/* 关闭按钮 */}
        <button
          onClick={() => setFullscreenPhoto(null)}
          className="absolute top-3 right-3 p-2 rounded-full bg-[#2C2C2C]/60 text-[#F4F1EA] cursor-pointer hover:bg-[#2C2C2C] transition-colors z-10"
          title="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 大图明信片 */}
        <img
          src={fullscreenPhoto}
          alt={`${data.name} 游历明信片`}
          className="max-w-full max-h-[65vh] rounded-xl shadow-2xl border border-[#C5A55A]/30"
          style={bridgeReady ? undefined : { userSelect: 'auto', WebkitUserSelect: 'auto', WebkitTouchCallout: 'default' as any }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* 操作按钮栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={savePhoto}
            disabled={saving}
            className="flex items-center gap-2 rounded-full font-semibold px-5 py-2.5 bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/20 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{saving ? '处理中…' : bridgeReady ? '存入相册' : isTouchWebView ? '长按图片保存' : '保存明信片'}</span>
          </button>
          {bridgeReady && (
            <button
              onClick={sharePhotoAsNote}
              disabled={saving}
              className="flex items-center gap-2 rounded-full font-semibold px-5 py-2.5 bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/20 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>发布为笔记</span>
            </button>
          )}
        </div>

        {savedTip && (
          <p className="text-xs font-semibold text-[#3B6B5E] tracking-widest">{savedTip}</p>
        )}
      </div>
    )}

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

          <div className="relative flex items-center gap-2 shrink-0">
            <button
              onClick={handleStamp}
              title={isStamped ? '再按一次，重新拍下当前视角' : '拍下当前视角并盖印'}
              className={`stamp-seal px-2.5 sm:px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all duration-300 shadow-md ${
                isStamped
                  ? 'bg-[#B83B32] text-[#F4F1EA] border-[#B83B32] scale-105'
                  : 'bg-[#F4F1EA] text-[#B83B32] hover:bg-[#B83B32] hover:text-[#F4F1EA]'
              }`}
            >
              {shooting ? '成像中…' : isStamped ? '✓ 已印' : '盖印'}
            </button>

            {/* 截屏失败提示 */}
            {photoTip && (
              <span className="absolute -bottom-6 right-0 text-[10px] text-[#B83B32] font-semibold whitespace-nowrap">
                {photoTip}
              </span>
            )}

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
            <div className="writing-vertical text-xs tracking-[0.3em] text-[#6B6B6B] font-medium h-44 sm:h-48 opacity-90 border-r border-[#2C2C2C]/10 pr-3">
              〔{data.dynasty}〕{data.poet} ·《{data.poem}》
            </div>

            {/* 诗句水墨正文：原文以 \n 分句，whitespace-pre-line 使每句独立成列 */}
            <div className="writing-vertical whitespace-pre-line text-base sm:text-lg font-bold tracking-[0.45em] leading-relaxed text-[#2C2C2C] h-44 sm:h-48 pl-2">
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

      <AliasModal
        open={showAliasModal}
        initial={userAlias}
        onConfirm={handleAliasConfirm}
        onClose={() => setShowAliasModal(false)}
      />
    </>
  );
};
