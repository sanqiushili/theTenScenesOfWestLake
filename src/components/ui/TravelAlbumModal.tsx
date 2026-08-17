import React, { useRef, useEffect, useState } from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES, ALL_SCENE_IDS, SceneId } from '../../store/useWestLakeStore';
import { loadImage } from '../../utils/scenePhoto';
import { X, Download, Award, Image as ImageIcon, Send } from 'lucide-react';

export const TravelAlbumModal: React.FC = () => {
  const { isTravelAlbumOpen, setTravelAlbumOpen, collectedStamps, scenePhotos } = useWestLakeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  // 绘制《西湖游历图册》宣纸画卷；已盖印景致展示当时的视角明信片
  const drawAlbumCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const width = (canvas.width = 1000);
    const height = (canvas.height = 560);

    // 1. 宣纸底色
    ctx.fillStyle = '#F4F1EA';
    ctx.fillRect(0, 0, width, height);

    // 2. 宣纸边框
    ctx.strokeStyle = '#2C2C2C';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.strokeStyle = '#C5A55A';
    ctx.lineWidth = 1;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    // 3. 画卷标题
    ctx.fillStyle = '#2C2C2C';
    ctx.font = 'bold 36px "Ma Shan Zheng", "Noto Serif SC", serif';
    ctx.fillText('西湖游历图册', 60, 80);

    ctx.font = '16px "Noto Serif SC", serif';
    ctx.fillStyle = '#555555';
    ctx.fillText(`已收录景致印痕：${collectedStamps.size} / ${ALL_SCENE_IDS.length}`, 60, 115);

    // 4. 绘制印章网格（5 列 × 2 行）
    ALL_SCENE_IDS.forEach((id, idx) => {
      const data = WEST_LAKE_SCENES[id];
      const isStamped = collectedStamps.has(id);

      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const cellW = 176;
      const x = 52 + col * (cellW + 10);
      const y = 150 + row * 170;

      // 印章框
      ctx.fillStyle = isStamped ? 'rgba(184, 59, 50, 0.08)' : 'rgba(44, 44, 44, 0.03)';
      ctx.strokeStyle = isStamped ? '#B83B32' : '#C8C5BC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, 150, 8);
      ctx.fill();
      ctx.stroke();

      const photo = isStamped ? photos[id] : undefined;
      if (photo) {
        /* 已盖印且有照片：明信片式铺满整格；contain 完整展示，
           不裁掉底部书法落款与印章（照片内已有名字，不再重复绘制） */
        const px = x + 8, py = y + 8, pw = cellW - 16, ph = 134;
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
        ctx.strokeRect(x + 96, y + 58, 60, 60);

        ctx.font = 'bold 15px "Ma Shan Zheng", serif';
        ctx.fillText(data.stampName.substring(0, 2), x + 108, y + 84);
        ctx.fillText(data.stampName.substring(2, 4), x + 108, y + 106);
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
        ctx.fillText('〔未解锁〕', x + 96, y + 92);
      }
    });

    // 5. 落款日期
    const today = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillStyle = '#555555';
    ctx.font = '14px "Noto Serif SC", serif';
    ctx.fillText(`落款：丙午年 · ${today}`, 760, 520);
  };

  useEffect(() => {
    if (isTravelAlbumOpen) {
      setTimeout(drawAlbumCanvas, 100);
    }
  }, [isTravelAlbumOpen, collectedStamps, scenePhotos]);

  // ── 导出保存兼容（小红书「小工具」官方 JSAPI）──
  // 容器自动注入 window.xhs.miniTool（saveImageToPhotosAlbum / writeTempFile / postNote），
  // 禁 a[download] 与长按菜单。调用约定（官方能力清单 §3）：
  // 唯一入口 window.xhs.miniTool.<api>(options)；不传任何回调时返回 Promise；
  // 参数按 JSON Schema 校验，未声明的字段不要传；window.xhs?.miniTool 判空并留降级路径。
  // 降级链：① 小工具容器 → JSAPI 存相册（大图先 writeTempFile 换 filePath）；
  //        ② 普通移动端 WebView → 弹大图引导长按保存；
  //        ③ 桌面浏览器 → a[download] 文件下载。
  const miniTool = typeof window !== 'undefined' ? (window as any).xhs?.miniTool : undefined;
  const hasBridge = typeof miniTool?.saveImageToPhotosAlbum === 'function';
  const isTouchWebView =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0);
  const [savedTip, setSavedTip] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const showTip = (msg: string) => {
    setSavedTip(msg);
    setTimeout(() => setSavedTip(''), 2500);
  };

  // 大图 base64 先用 writeTempFile 落成临时文件，避免超长 base64 上行；失败回退直传 dataURL
  const toTempFile = async (dataUrl: string): Promise<string> => {
    if (typeof miniTool?.writeTempFile === 'function') {
      try {
        const res = await miniTool.writeTempFile({ data: dataUrl });
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
    const url = canvas.toDataURL('image/png');

    // ① 小红书小工具：JSAPI 存入系统相册（需用户主动点击触发，首次会弹相册权限）
    if (hasBridge) {
      setSaving(true);
      try {
        const filePath = await toTempFile(url);
        await miniTool.saveImageToPhotosAlbum({ filePath });
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
    a.download = `西湖游历图册_${Date.now()}.png`;
    a.click();
  };

  // 小工具额外端能力：把图册带入小红书笔记发布页（postNote，成功只代表发布页被唤起）
  const shareAsNote = async () => {
    const canvas = canvasRef.current;
    if (!canvas || saving || typeof miniTool?.postNote !== 'function') return;
    setSaving(true);
    try {
      const imgUrl = await toTempFile(canvas.toDataURL('image/png'));
      await miniTool.postNote({
        title: '西湖十景 · 游历图册',
        content: '在水墨体素的西湖里漫游，逐景盖印留影，集成一卷专属游历图册。',
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
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-[#B83B32]" />
            <h2 className="text-xl font-bold tracking-widest text-[#2C2C2C]">
              《西湖游历图册》鉴赏
            </h2>
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

        {/* 底部导出与操作栏 */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-[#555555]">
            💡 游览景点时按下“盖印”，即拍下当前视角并落印，收录为一页游历明信片。
          </p>
          <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportImage}
            disabled={saving}
            className="btn-ink flex items-center gap-2 rounded-full font-semibold border-[#B83B32] text-[#B83B32] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{saving ? '处理中…' : hasBridge ? '存入相册' : isTouchWebView ? '保存画卷' : '导出全景画卷 PNG'}</span>
          </button>
          {/* 小工具端能力：把图册带入小红书笔记发布页 */}
          {typeof miniTool?.postNote === 'function' && (
            <button
              onClick={shareAsNote}
              disabled={saving}
              className="btn-ink flex items-center gap-2 rounded-full font-semibold border-[#3B6B5E] text-[#3B6B5E] disabled:opacity-50"
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
    </div>
  );
};
