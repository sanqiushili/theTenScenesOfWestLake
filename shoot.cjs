const { chromium } = require('playwright');

const SCENES = [
  { name: '苏堤春晓', file: 'su_di' },
  { name: '三潭印月', file: 'san_tan' },
  { name: '断桥残雪', file: 'duan_qiao' },
  { name: '曲院风荷', file: 'qu_yuan' },
  { name: '雷峰夕照', file: 'lei_feng' },
  { name: '南屏晚钟', file: 'nan_ping' },
  { name: '柳浪闻莺', file: 'liu_lang' },
  { name: '双峰插云', file: 'shuang_feng' },
  { name: '灵峰探梅', file: 'ling_feng' },
  { name: '花港观鱼', file: 'hua_gang' }
];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  // 等待 WebGL 首帧与体素世界构建
  await page.waitForTimeout(6000);
  await page.screenshot({ path: 'shots/00-overview.png' });

  for (const s of SCENES) {
    const btn = page.locator(`button[title="${s.name}"]`).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(4200); // 等待贝塞尔运镜落位
      await page.screenshot({ path: `shots/${s.file}.png` });
    } else {
      console.log('MISSING BUTTON for', s.name);
    }
  }

  // 回到总览
  await page.locator('button:has-text("西湖十景")').first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'shots/99-back-overview.png' });

  if (errors.length) {
    console.log('=== CONSOLE/PAGE ERRORS ===');
    errors.slice(0, 20).forEach((e) => console.log(e));
  } else {
    console.log('NO_RUNTIME_ERRORS');
  }

  await browser.close();
})();
