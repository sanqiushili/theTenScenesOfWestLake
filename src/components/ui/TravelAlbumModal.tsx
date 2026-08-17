import React, { useRef, useEffect, useState } from 'react';
import { useWestLakeStore, WEST_LAKE_SCENES, ALL_SCENE_IDS, SceneId } from '../../store/useWestLakeStore';
import { loadImage } from '../../utils/scenePhoto';
import { X, Download, Award } from 'lucide-react';

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
        /* 已盖印且有照片：明信片式展示；contain 完整展示，
           不裁掉底部书法落款与印章 */
        const px = x + 8, py = y + 6, pw = cellW - 16, ph = 100;
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

        ctx.fillStyle = '#2C2C2C';
        ctx.font = 'bold 15px "Noto Serif SC", serif';
        ctx.fillText(data.name, x + 12, y + 126);
        ctx.font = '10px "Noto Serif SC", serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(data.pinyin, x + 12, y + 141);
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

  // 导出 PNG：浏览器端走文件下载；小红书小工具容器内改走 JSBridge 存入系统相册
  const isXhsMiniTool = typeof window !== 'undefined' && !!(window as any).xhs?.miniTool;
  const [savedTip, setSavedTip] = useState('');

  const exportImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');

    const bridge = (window as any).xhs?.miniTool;
    if (bridge?.saveImageToPhotosAlbum) {
      try {
        // 容器禁止 a[download]，经 writeTempFile 换本地路径后存相册
        const { filePath } = bridge.writeTempFile
          ? await bridge.writeTempFile({ data: url })
          : { filePath: url };
        await bridge.saveImageToPhotosAlbum({ filePath });
        setSavedTip('已存入系统相册 ✓');
        setTimeout(() => setSavedTip(''), 2500);
      } catch {
        setSavedTip('保存失败，请检查相册权限');
        setTimeout(() => setSavedTip(''), 2500);
      }
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = `西湖游历图册_${Date.now()}.png`;
    a.click();
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
          <button
            onClick={exportImage}
            className="btn-ink flex items-center gap-2 rounded-full font-semibold border-[#B83B32] text-[#B83B32]"
          >
            <Download className="w-4 h-4" />
            <span>{isXhsMiniTool ? '存入相册' : '导出全景画卷 PNG'}</span>
          </button>
        </div>
        {savedTip && (
          <p className="mt-2 text-right text-xs font-semibold text-[#3B6B5E]">{savedTip}</p>
        )}
      </div>
    </div>
  );
};
