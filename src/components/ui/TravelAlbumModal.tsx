import React, { useRef, useEffect, useState } from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES, ALL_SCENE_IDS, SceneId } from '../../store/useWestLakeStore';
import { loadImage } from '../../utils/scenePhoto';
import { HANDBILL_PRESETS, randomHandbill } from '../../utils/personalize';
import { AliasModal } from './AliasModal';
import { X, Download, Award, Image as ImageIcon, Send, PenLine, Shuffle } from 'lucide-react';

// ── 图册比例预设：横版(原) / 方图 / 竖版(小红书 3:4) ──
export type AlbumRatio = 'landscape' | 'square' | 'portrait';

const RATIO_OPTIONS: { key: AlbumRatio; label: string }[] = [
  { key: 'landscape', label: '横版' },
  { key: 'square', label: '方图' },
  { key: 'portrait', label: '竖版' },
];

// 每种比例的画布逻辑尺寸（导出物理像素 = 逻辑 × RENDER_SCALE）与网格列行数
// 列×行均 ≥ 11，确保十景 + 灵峰探梅 全部容纳不溢出
const RATIO_CONFIG: Record<AlbumRatio, { w: number; h: number; cols: number; rows: number; headerBottom: number; big: boolean }> = {
  landscape: { w: 1000, h: 560, cols: 6, rows: 2, headerBottom: 188, big: false },
  square: { w: 1080, h: 1080, cols: 4, rows: 3, headerBottom: 260, big: true },
  portrait: { w: 1080, h: 1440, cols: 3, rows: 4, headerBottom: 260, big: true },
};

// 渲染放大系数：矢量重绘 + 高 dpi，导出图片清晰不糊；配合 JPEG 控制体积
const RENDER_SCALE = 2;

export const TravelAlbumModal: React.FC = () => {
  const {
    isTravelAlbumOpen,
    setTravelAlbumOpen,
    collectedStamps,
    scenePhotos,
    userAlias,
    userHandbill,
    setUserHandbill,
    setUserAlias
  } = useWestLakeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  // 当前图册比例（默认竖版，最适配小红书）
  const [ratio, setRatio] = useState<AlbumRatio>('portrait');

  // 绘制《西湖游历图册》宣纸画卷；已盖印景致展示当时的视角明信片
  const drawAlbumCanvas = async (r: AlbumRatio) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cfg = RATIO_CONFIG[r];
    const W = cfg.w, H = cfg.h;

    // 高分辨率离屏渲染：物理像素 = 逻辑尺寸 × RENDER_SCALE，导出即高清
    canvas.width = Math.round(W * RENDER_SCALE);
    canvas.height = Math.round(H * RENDER_SCALE);
    ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);

    // 预加载已盖印景致的明信片照片（dataURL 解码很快，但仍需等 onload）
    const photos: Partial<Record<SceneId, HTMLImageElement>> = {};
    await Promise.all(
      ALL_SCENE_IDS
        .filter((id) => collectedStamps.has(id) && scenePhotos[id])
        .map(async (id) => {
          try {
            photos[id] = await loadImage(scenePhotos[id]!);
          } catch {
            /* 照片损坏时回退为纯印章展示 */
          }
        })
    );

    // 1. 宣纸底色
    ctx.fillStyle = '#F4F1EA';
    ctx.fillRect(0, 0, W, H);

    // 2. 宣纸边框
    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    ctx.strokeStyle = '#C5A55A';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, W - 52, H - 52);

    // 3. 标题 + 个性化（题名 / 游历手札）—— 随用户选择实时重绘
    const big = cfg.big;
    const titleSize = big ? 48 : 36;
    const titleY = big ? 96 : 80;
    const countY = big ? 140 : 115;
    const aliasY = big ? 184 : 145;
    const handbillY = big ? 220 : 170;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#2C2C2C';
    ctx.font = `bold ${titleSize}px "Ma Shan Zheng", "Noto Serif SC", serif`;
    ctx.fillText('西湖游历图册', 60, titleY);

    ctx.font = '16px "Noto Serif SC", serif';
    ctx.fillStyle = '#555555';
    ctx.fillText(`已收录景致印痕：${collectedStamps.size} / ${ALL_SCENE_IDS.length}`, 60, countY);

    ctx.fillStyle = '#8A6B3A';
    ctx.font = '15px "Noto Serif SC", serif';
    ctx.fillText(`题名 · ${userAlias}`, 60, aliasY);

    if (userHandbill) {
      ctx.fillStyle = '#2C2C2C';
      ctx.font = 'italic 16px "Noto Serif SC", serif';
      ctx.fillText(`「${userHandbill}」`, 60, handbillY);
    }

    // 4. 印章网格（按比例的列数 / 行数自适应铺满，容纳全部 11 景）
    const pad = 40;
    const top = cfg.headerBottom + 14;
    const footer = 64;
    const gap = 12;
    const gridAreaW = W - pad * 2;
    const gridAreaH = H - top - footer;
    const cellW = (gridAreaW - (cfg.cols - 1) * gap) / cfg.cols;
    const cellH = (gridAreaH - (cfg.rows - 1) * gap) / cfg.rows;

    ALL_SCENE_IDS.forEach((id, idx) => {
      const data = WEST_LAKE_SCENES[id];
      const isStamped = collectedStamps.has(id);

      const col = idx % cfg.cols;
      const row = Math.floor(idx / cfg.cols);
      const x = pad + col * (cellW + gap);
      const y = top + row * (cellH + gap);

      // 印章框
      ctx.fillStyle = isStamped ? 'rgba(184, 59, 50, 0.08)' : 'rgba(44, 44, 44, 0.03)';
      ctx.strokeStyle = isStamped ? '#B83B32' : '#C8C5BC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, 8);
      ctx.fill();
      ctx.stroke();

      const photo = isStamped ? photos[id] : undefined;
      if (photo) {
        /* 已盖印且有照片：明信片式铺满整格；contain 完整展示，
           不裁掉底部书法落款与印章（照片内已有名字，不再重复绘制） */
        const px = x + 6, py = y + 6, pw = cellW - 12, ph = cellH - 12;
        const ar = photo.width / photo.height;
        let dw = pw, dh = pw / ar;
        if (dh > ph) { dh = ph; dw = ph * ar; }
        const dx = px + (pw - dw) / 2, dy = py + (ph - dh) / 2;
        ctx.save();
        ctx.shadowColor = 'rgba(44, 44, 44, 0.18)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(photo, dx, dy, dw, dh);
        ctx.restore();
        ctx.strokeStyle = 'rgba(44, 44, 44, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(dx + 0.5, dy + 0.5, dw - 1, dh - 1);
      } else if (isStamped) {
        /* 已盖印但无照片（回退）：名称 + 朱砂落印 */
        ctx.fillStyle = '#2C2C2C';
        ctx.font = 'bold 20px "Noto Serif SC", serif';
        ctx.fillText(data.name, x + 16, y + 42);

        ctx.font = '11px "Noto Serif SC", serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(data.pinyin, x + 16, y + 62);

        ctx.fillStyle = '#B83B32';
        ctx.strokeStyle = '#B83B32';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + cellW - 76, y + cellH - 76, 60, 60);

        ctx.font = 'bold 15px "Ma Shan Zheng", serif';
        ctx.fillText(data.stampName.substring(0, 2), x + cellW - 64, y + cellH - 50);
        ctx.fillText(data.stampName.substring(2, 4), x + cellW - 64, y + cellH - 28);
      } else {
        /* 未解锁 */
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 20px "Noto Serif SC", serif';
        ctx.fillText(data.name, x + 16, y + 42);

        ctx.font = '11px "Noto Serif SC", serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(data.pinyin, x + 16, y + 62);

        ctx.fillStyle = '#C8C5BC';
        ctx.font = '12px "Noto Serif SC", serif';
        ctx.fillText('〔未解锁〕', x + cellW - 76, y + cellH - 28);
      }
    });

    // 5. 落款日期（右对齐贴底）—— 高分辨率下仍清晰
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.textAlign = 'right';
    ctx.fillStyle = '#555555';
    ctx.font = '14px "Noto Serif SC", serif';
    ctx.fillText(`落款：丙午年 · ${today}`, W - 40, H - 28);
    ctx.textAlign = 'left';
  };

  useEffect(() => {
    if (isTravelAlbumOpen) {
      // 关键：ratio / 题名 / 手札 变化都要触发重绘，否则保存的图不含最新个性化
      const t = setTimeout(() => drawAlbumCanvas(ratio), 100);
      return () => clearTimeout(t);
    }
  }, [isTravelAlbumOpen, collectedStamps, scenePhotos, userAlias, userHandbill, ratio]);

  // ── 导出保存兼容（小红书「小工具」官方 JSAPI）──
  // 容器自动注入 window.xhs.miniTool（saveImageToPhotosAlbum / writeTempFile / postNote），
  // 禁 a[download] 与长按菜单。调用约定（官方能力清单 §3）：
  // 唯一入口 window.xhs.miniTool.<api>(options)；不传任何回调时返回 Promise；
  // 参数按 JSON Schema 校验，未声明的字段不要传；window.xhs?.miniTool 判空并留降级路径。
  // 降级链：① 小工具容器 → JSAPI 存相册（大图先 writeTempFile 换 filePath）；
  //        ② 普通移动端 WebView → 弹大图引导长按保存；
  //        ③ 桌面浏览器 → a[download] 文件下载。
  //
  // 关键：SDK 注入是异步的，组件首次渲染时 window.xhs.miniTool 可能尚未就绪。
  // 用 bridgeReady state + 轮询检测；点击时再检测一次做双保险。
  const isTouchWebView =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0);
  const [bridgeReady, setBridgeReady] = useState(false);
  const [savedTip, setSavedTip] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showAliasModal, setShowAliasModal] = useState(false);

  // 轮询检测 SDK 注入（最多等 5s），就绪后 bridgeReady=true 触发按钮文案更新
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

  // 大图 base64 先用 writeTempFile 落成临时文件，避免超长 base64 上行；失败回退直传 dataURL
  const toTempFile = async (mt: any, dataUrl: string): Promise<string> => {
    if (typeof mt?.writeTempFile === 'function') {
      try {
        const res = await mt.writeTempFile({ data: dataUrl });
        if (res?.filePath) return res.filePath;
      } catch {
        /* 回退直传 dataURL（saveImageToPhotosAlbum 的 filePath 也接受 data: base64） */
      }
    }
    return dataUrl;
  };

  const exportImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    // 高清 JPEG（无透明需求，体积远小于 PNG，便于 writeTempFile 上行）
    const url = canvas.toDataURL('image/jpeg', 0.92);

    // ① 小红书小工具：JSAPI 存入系统相册（点击时重新检测，防止 SDK 延迟注入）
    const mt = (window as any).xhs?.miniTool;
    if (mt && typeof mt.saveImageToPhotosAlbum === 'function') {
      setSaving(true);
      try {
        const filePath = await toTempFile(mt, url);
        await mt.saveImageToPhotosAlbum({ filePath });
        showTip('已存入系统相册 ✓');
      } catch (err: any) {
        showTip(err?.errMsg ? '保存失败，请检查相册权限' : '保存失败，请重试');
      } finally {
        setSaving(false);
      }
      return;
    }

    // ② 普通移动端 WebView：弹大图长按保存（小工具容器内长按菜单被禁，不会走到这里）
    if (isTouchWebView) {
      setPreviewUrl(url);
      return;
    }

    // ③ 桌面浏览器：文件下载
    const a = document.createElement('a');
    a.href = url;
    a.download = `西湖游历图册_${Date.now()}.jpg`;
    a.click();
  };

  // 小工具额外端能力：把图册带入小红书笔记发布页（postNote，成功只代表发布页被唤起）
  const shareAsNote = async () => {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    const mt = (window as any).xhs?.miniTool;
    if (!mt || typeof mt.postNote !== 'function') return;
    setSaving(true);
    try {
      const imgUrl = await toTempFile(mt, canvas.toDataURL('image/jpeg', 0.92));
      await mt.postNote({
        title: '西湖十景 · 游历图册',
        content: `我是「${userAlias}」，在水墨体素的西湖里漫游，逐景盖印留影，集成一卷专属游历图册。${userHandbill ? '游历手札：「' + userHandbill + '」' : ''}`,
        tags: '#西湖十景 #数字艺术 #水墨',
        mediaInfo: { image_resources: [{ url: imgUrl }] }
      });
    } catch {
      showTip('未能唤起发布页，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (!isTravelAlbumOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-md p-4 animate-ink-fade pointer-events-auto">
      <div className="glass-ink-panel p-4 sm:p-6 rounded-3xl max-w-4xl w-full border-2 border-[#C5A55A] shadow-2xl relative max-h-[88vh] overflow-y-auto">
        {/* 标题与关闭按钮 */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2C2C2C]/10 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Award className="w-6 h-6 text-[#B83B32]" />
            <h2 className="text-xl font-bold tracking-widest text-[#2C2C2C]">
              《西湖游历图册》鉴赏
            </h2>
            <button
              onClick={() => setShowAliasModal(true)}
              className="flex items-center gap-1 text-xs text-[#8A6B3A] cursor-pointer hover:underline"
              title="修改题名"
            >
              <PenLine className="w-3.5 h-3.5" /> {userAlias}
            </button>
          </div>
          <button
            onClick={() => setTravelAlbumOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#2C2C2C]/10 text-[#555555] cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 宣纸 Canvas 预览 */}
        <div className="w-full overflow-hidden flex justify-center bg-[#F4F1EA] rounded-xl p-2 shadow-inner border border-[#2C2C2C]/10">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded" />
        </div>

        {/* 保存比例切换：横版 / 方图 / 竖版（竖版最适配小红书） */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#2C2C2C] tracking-widest">保存比例</span>
          <div className="flex gap-1.5">
            {RATIO_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setRatio(opt.key)}
                className={`px-3 py-1 rounded-full text-xs cursor-pointer border transition-all ${
                  ratio === opt.key
                    ? 'bg-[#2C2C2C] text-[#F4F1EA] border-[#2C2C2C]'
                    : 'bg-[#F4F1EA] text-[#555555] border-[#2C2C2C]/20 hover:border-[#2C2C2C]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-[#888888]">竖版更适配小红书</span>
        </div>

        {/* 游历手札：选一句当游历口令（星巴克取单号风格），印在封面点睛 */}
        <div className="mt-4 px-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#2C2C2C] tracking-widest">
              游历手札 · 选一句当口令
            </p>
            <button
              onClick={() => setUserHandbill(randomHandbill(userHandbill))}
              className="flex items-center gap-1 text-xs text-[#3B6B5E] cursor-pointer hover:underline"
            >
              <Shuffle className="w-3.5 h-3.5" /> 随机一句
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {HANDBILL_PRESETS.map((line) => (
              <button
                key={line}
                onClick={() => setUserHandbill(line)}
                className={`px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all border ${
                  userHandbill === line
                    ? 'bg-[#3B6B5E] text-[#F4F1EA] border-[#3B6B5E]'
                    : 'bg-[#F4F1EA] text-[#555555] border-[#2C2C2C]/20 hover:border-[#3B6B5E]'
                }`}
              >
                {line}
              </button>
            ))}
          </div>
        </div>

        {/* 底部导出与操作栏 */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[#555555]">
            💡 游览景点时按下“盖印”，即拍下当前视角并落印，收录为一页游历明信片。
          </p>
          <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportImage}
            disabled={saving}
            className="flex items-center gap-2 rounded-full font-semibold px-5 py-2.5 bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/20 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{saving ? '处理中…' : bridgeReady ? '存入相册' : isTouchWebView ? '保存画卷' : '导出画卷 JPG'}</span>
          </button>
          {/* 小工具端能力：把图册带入小红书笔记发布页 */}
          {bridgeReady && (
            <button
              onClick={shareAsNote}
              disabled={saving}
              className="flex items-center gap-2 rounded-full font-semibold px-5 py-2.5 bg-[#F4F1EA] text-[#2C2C2C] border border-[#2C2C2C]/20 hover:bg-[#2C2C2C] hover:text-[#F4F1EA] hover:border-[#2C2C2C] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>发布为笔记</span>
            </button>
          )}
          </div>
        </div>
        {savedTip && (
          <p className="mt-2 text-right text-xs font-semibold text-[#3B6B5E]">{savedTip}</p>
        )}
      </div>

      {/* 长按保存大图层：移动端 WebView（小红书小工具沙箱等）无下载能力的兜底 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-4 bg-[#1A1A1A]/85 backdrop-blur-md p-4"
          onClick={() => setPreviewUrl('')}
        >
          <p className="text-sm text-[#F4F1EA] tracking-widest flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" /> 长按下方画卷，选择「保存图片」即可存入相册
          </p>
          {/* 全局 * { user-select:none } 会压制 WebView 长按菜单，这里逐项恢复 */}
          <img
            src={previewUrl}
            alt="西湖游历图册"
            className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
            style={{ userSelect: 'auto', WebkitUserSelect: 'auto', WebkitTouchCallout: 'default' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="text-xs text-[#F4F1EA]/60 tracking-widest underline underline-offset-4 cursor-pointer"
            onClick={() => setPreviewUrl('')}
          >
            收起
          </button>
        </div>
      )}
      <AliasModal
        open={showAliasModal}
        initial={userAlias}
        onConfirm={(a) => setUserAlias(a)}
        onClose={() => setShowAliasModal(false)}
      />
    </div>
  );
};
