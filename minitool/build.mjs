/**
 * 小红书「小工具」打包流水线（与常规网站构建完全隔离）。
 *
 * 流程：
 * 1. vite build -c minitool/vite.config.ts  → minitool-dist/（IIFE 经典脚本）
 * 2. 复制子集化字体（minitool/tmp/woff2）→ minitool-dist/assets/fonts/
 * 3. 生成 assets/fonts.css 并改写 index.html：
 *    - 移除 Google Fonts / favicon 等外部引用
 *    - viewport 补 viewport-fit=cover
 *    - 脚本标签去掉 type="module" / crossorigin（容器只允许经典脚本）
 * 4. 全量合规扫描（外部 URL / module 脚本 / 内联脚本 / 禁用文件类型）
 * 5. cd minitool-dist && zip → 项目根 minitool.zip（index.html 在 zip 根）
 *
 * 用法：node minitool/build.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'minitool-dist');
const FONTS_SRC = path.join(ROOT, 'minitool', 'tmp', 'woff2');

const log = (s) => console.log(`[minitool] ${s}`);
const fail = (s) => {
  console.error(`[minitool] ❌ ${s}`);
  process.exit(1);
};

// ---------- 1. 构建 ----------
log('1/5 vite build（IIFE 经典脚本）...');
execSync('npx vite build -c minitool/vite.config.ts', { cwd: ROOT, stdio: 'inherit' });

// ---------- 2. 字体 ----------
log('2/5 复制子集化字体...');
const fontsDir = path.join(DIST, 'assets', 'fonts');
fs.mkdirSync(fontsDir, { recursive: true });
for (const f of fs.readdirSync(FONTS_SRC)) {
  if (!f.endsWith('.woff2')) continue;
  fs.copyFileSync(path.join(FONTS_SRC, f), path.join(fontsDir, f));
}

// 字体声明：700 复用 600 文件（实际样式只有 medium/semibold/bold，且 300/400 源文件相同）
const FONTS_CSS = `/* 离线子集字体：仅包含项目实际用字（约 900 汉字），由 minitool/build.mjs 注入 */
@font-face {
  font-family: 'Ma Shan Zheng';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(./fonts/mashanzheng-400.woff2) format('woff2');
}
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(./fonts/notoserif-400.woff2) format('woff2');
}
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(./fonts/notoserif-600.woff2) format('woff2');
}
@font-face {
  font-family: 'Noto Serif SC';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(./fonts/notoserif-600.woff2) format('woff2');
}
`;
fs.writeFileSync(path.join(DIST, 'assets', 'fonts.css'), FONTS_CSS);

// ---------- 3. 改写 index.html ----------
log('3/5 改写 index.html（去外链 / 去 module / 补安全区）...');
const htmlPath = path.join(DIST, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const before = html;

// 移除外部引用（Google Fonts / preconnect / favicon）
html = html.replace(/<link[^>]*fonts\.g[^\n]*>\n?/g, '');
html = html.replace(/<link[^>]*rel="icon"[^>]*>\n?/g, '');
// viewport 补 viewport-fit=cover（容器安全区要求，需写在 content 属性内）
html = html.replace(
  /(<meta name="viewport" content="[^"]*?)("\s*\/?>)/,
  (m, head, tail) => (head.includes('viewport-fit') ? m : `${head}, viewport-fit=cover${tail}`)
);
// 注入离线字体样式表
html = html.replace('</head>', '  <link rel="stylesheet" href="./assets/fonts.css" />\n  </head>');
// 脚本改为经典脚本（容器 CSP 禁 type="module"）
html = html.replace(/<script([^>]*)\stype="module"([^>]*)>/g, '<script$1$2>');
html = html.replace(/<script([^>]*)\scrossorigin([^>]*)>/g, '<script$1$2>');
// 经典脚本无 defer 语义：从 head 移到 body 末尾，确保 #root 先于脚本执行存在
const scriptTag = html.match(/<script[^>]*src="[^"]+"[^>]*><\/script>/);
if (scriptTag) {
  html = html.replace(scriptTag[0], '').replace('</body>', `  ${scriptTag[0]}\n  </body>`);
}

if (html === before) fail('index.html 未被修改，正则失配，请人工检查');
fs.writeFileSync(htmlPath, html);

// ---------- 4. 合规扫描 ----------
log('4/5 全量合规扫描...');
const ALLOWED_EXT = new Set(['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.json']);
const issues = [];
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(DIST);

for (const p of files) {
  const rel = path.relative(DIST, p);
  if (rel === '.DS_Store') { fs.rmSync(p); continue; }
  const ext = path.extname(p).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) issues.push(`禁用文件类型: ${rel}`);
  if (rel.endsWith('.map')) issues.push(`sourcemap 残留: ${rel}`);

  if (['.html', '.js', '.css'].includes(ext)) {
    const src = fs.readFileSync(p, 'utf8');
    if (rel.endsWith('.html')) {
      if (/type\s*=\s*"module"/.test(src)) issues.push(`${rel}: 残留 type="module"`);
      if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?[^\s]/.test(src.replace(/<script[^>]*src=[^>]*><\/script>/g, ''))) {
        if (/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(src)) issues.push(`${rel}: 疑似内联脚本`);
      }
      if (/onclick=|onload=|javascript:/i.test(src)) issues.push(`${rel}: 行内事件/javascript: URI`);
      if (!/name="viewport" content="[^"]*viewport-fit=cover/.test(src)) issues.push(`${rel}: viewport 的 content 缺 viewport-fit=cover`);
    }
    // 外部引用（data:/blob: 允许；JS 内的命名空间/注释/许可证字符串常量白名单放行）
    const external = src.match(/https?:\/\/[^\s"'`)]+/g) || [];
    const BENIGN = /^http:\/\/www\.w3\.org\/|^https:\/\/(reactjs\.org|gsap\.com|github\.com|docs\.pmnd\.rs)(\/|$)/;
    if (rel.endsWith('.html') || rel.endsWith('.css')) {
      for (const u of external) issues.push(`${rel}: 外部引用 ${u.slice(0, 60)}`);
    } else {
      for (const u of external) {
        if (!BENIGN.test(u)) issues.push(`${rel}: 外部引用 ${u.slice(0, 60)}`);
      }
    }
    if (rel.endsWith('.js') && /(^|\n)\s*(import|export)\s/m.test(src) && !/importScripts/.test(src)) {
      // IIFE 产物不应有顶层 import/export 语句
      if (/\bimport\s+[\w{*]/.test(src)) issues.push(`${rel}: 疑似 ES module import`);
    }
  }
}
if (issues.length) fail('合规扫描未通过:\n  - ' + issues.join('\n  - '));
log('合规扫描全部通过 ✓');

// ---------- 5. 打包 zip ----------
log('5/5 压缩 zip（index.html 位于 zip 根）...');
const zipPath = path.join(ROOT, 'minitool.zip');
if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
execSync(`zip -qr "${zipPath}" . -x "*.DS_Store"`, { cwd: DIST, stdio: 'inherit' });

// ---------- 摘要 ----------
const zipSize = fs.statSync(zipPath).size;
const distSize = files.reduce((s, f) => s + fs.statSync(f).size, 0);
log('──────── 打包完成 ────────');
log(`产物: ${zipPath}`);
log(`zip 体积: ${(zipSize / 1024 / 1024).toFixed(2)} MB（上限 10MB，建议 ≤2MB）`);
log(`解压体积: ${(distSize / 1024 / 1024).toFixed(2)} MB，文件数 ${files.length}`);
for (const f of files.sort()) {
  const rel = path.relative(DIST, f);
  log(`  ${(fs.statSync(f).size / 1024).toFixed(0).padStart(6)} KB  ${rel}`);
}
