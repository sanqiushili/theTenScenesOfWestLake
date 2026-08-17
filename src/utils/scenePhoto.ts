/**
 * 盖印即拍照：抓取用户当前视角的 WebGL 画面（含后处理），
 * 装裱成拍立得明信片（宣纸留白 + 景致落款 + 朱砂印章压在照片上）。
 * 依赖 Canvas 的 preserveDrawingBuffer，保证随时可截取最终帧；
 * 截到黑帧（渲染未就绪）时自动等下一帧重试。
 */
import type { SceneData } from '../store/useWestLakeStore';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 抽点采样判断是否截到了黑帧（渲染未就绪时 WebGL 缓冲是全黑的） */
function isMostlyBlank(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean {
  const w = canvas.width, h = canvas.height;
  let total = 0, n = 0;
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(w * (0.15 + 0.7 * ((i * 0.618) % 1)));
    const y = Math.floor(h * (0.15 + 0.7 * ((i * 0.382) % 1)));
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    total += (r + g + b) / 3;
    n++;
  }
  return total / n < 10;
}

/** 抓取 R3F 主画布（data-engine 标记），等比压缩为 JPEG；黑帧返回 null */
export function captureScenePhoto(maxWidth = 1280): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-engine]');
  if (!canvas || canvas.width === 0) return null;
  const scale = Math.min(1, maxWidth / canvas.width);
  const w = Math.round(canvas.width * scale);
  const h = Math.round(canvas.height * scale);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0, w, h);
  if (isMostlyBlank(out, ctx)) return null;
  return out.toDataURL('image/jpeg', 0.85);
}

/** 黑帧防护：等待渲染帧就绪后重试截取（最多 tries 次） */
export async function captureScenePhotoWithRetry(tries = 5): Promise<string | null> {
  for (let i = 0; i < tries; i++) {
    const url = captureScenePhoto();
    if (url) return url;
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
  }
  return null;
}

/** 朱砂印章（红底白文，2×2 字），微微倾斜更像手账落印 */
export function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  stampName: string,
  rotation = -0.1
): void {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(rotation);
  const s = size / 2;

  // 印底朱砂 + 外框
  ctx.fillStyle = '#B83B32';
  ctx.beginPath();
  ctx.roundRect(-s, -s, size, size, size * 0.08);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 241, 234, 0.85)';
  ctx.lineWidth = Math.max(1.5, size * 0.035);
  ctx.beginPath();
  ctx.roundRect(-s + size * 0.07, -s + size * 0.07, size * 0.86, size * 0.86, size * 0.05);
  ctx.stroke();

  // 白文 2×2
  ctx.fillStyle = '#F4F1EA';
  ctx.font = `${Math.round(size * 0.3)}px "Ma Shan Zheng", "Noto Serif SC", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = stampName.padEnd(4, '·').slice(0, 4);
  const off = size * 0.21;
  ctx.fillText(chars[0], -off, -off);
  ctx.fillText(chars[1], off, -off);
  ctx.fillText(chars[2], -off, off);
  ctx.fillText(chars[3], off, off);
  ctx.restore();
}

/**
 * 装裱成拍立得明信片：宣纸卡纸留白、底部书法落款（景名 + 日期），
 * 朱砂印章斜压在照片右下角——盖印即"到此一游"的实体照片。
 */
export async function composeStampedPhoto(
  photoUrl: string,
  data: SceneData,
  alias = '西湖客'
): Promise<string> {
  const img = await loadImage(photoUrl);
  const W = img.width;
  const margin = Math.round(W * 0.05);
  const bottom = Math.round(W * 0.13); // 底部宽留白写落款
  const photoW = W - margin * 2;
  const photoH = Math.round(img.height * (photoW / img.width));
  const out = document.createElement('canvas');
  out.width = W;
  out.height = margin + photoH + bottom;
  const ctx = out.getContext('2d');
  if (!ctx) return photoUrl;

  // 宣纸卡纸底
  ctx.fillStyle = '#F7F3EA';
  ctx.fillRect(0, 0, out.width, out.height);

  // 照片本体 + 细墨线锁边
  ctx.drawImage(img, margin, margin, photoW, photoH);
  ctx.strokeStyle = 'rgba(44, 44, 44, 0.28)';
  ctx.lineWidth = 1;
  ctx.strokeRect(margin + 0.5, margin + 0.5, photoW - 1, photoH - 1);

  // 底部落款：书法景名 + 题名（用户别号）+ 游历日期
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2C2C2C';
  ctx.font = `${Math.round(bottom * 0.32)}px "Ma Shan Zheng", "Noto Serif SC", serif`;
  ctx.fillText(data.name, margin + 4, margin + photoH + bottom * 0.30);
  // 用户题名：把「自己」落进明信片
  ctx.fillStyle = '#555555';
  ctx.font = `${Math.round(bottom * 0.24)}px "Noto Serif SC", serif`;
  ctx.fillText(`题 · ${alias}`, margin + 6, margin + photoH + bottom * 0.60);
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillStyle = '#8A8A8A';
  ctx.font = `${Math.round(bottom * 0.18)}px "Noto Serif SC", serif`;
  ctx.fillText(date, margin + 6, margin + photoH + bottom * 0.84);

  // 朱砂印章斜压在照片右下角，一半压照片一半压留白
  const sealSize = Math.round(W * 0.12);
  drawSeal(ctx, W - margin - sealSize * 0.62, margin + photoH - sealSize * 0.58, sealSize, data.stampName);

  // 留白是浅色平块，JPEG 质量给高些防色带
  return out.toDataURL('image/jpeg', 0.92);
}
