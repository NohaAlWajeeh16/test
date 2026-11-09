// تصدير البروشور إلى PowerPoint (A4 طولي) وصور عالية الدقة
// التشغيل بعد build.js:  node brochure/export.js
// صفحات الشهادات فيها خانات صور (Picture placeholders) — اضغطي على أيقونة الصورة داخل الإطار لإضافة الشهادة.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const pptxgen = require('pptxgenjs');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'output');
const IMG_DIR = path.join(OUT, 'pages');
const PX_PER_IN = 96;

(async () => {
  fs.rmSync(IMG_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });

  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2.5 });
  await p.goto('file://' + path.join(ROOT, 'brochure.html'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: '@media screen { .page { margin: 0 auto !important; box-shadow: none !important; } }' });

  const pages = await p.$$('section.page');
  const info = [];
  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];
    const n = String(i + 1).padStart(2, '0');
    // صورة الصفحة كما هي (للنشر)
    await el.screenshot({ path: path.join(IMG_DIR, `page-${n}.jpg`), type: 'jpeg', quality: 92 });
    // مواقع خانات الشهادات بالنسبة للصفحة
    const slots = await el.evaluate((pg) => {
      const r0 = pg.getBoundingClientRect();
      return [...pg.querySelectorAll('.slot-empty')].map((s) => {
        const r = s.getBoundingClientRect();
        return { x: r.left - r0.left, y: r.top - r0.top, w: r.width, h: r.height };
      });
    });
    let bg = path.join(IMG_DIR, `page-${n}.jpg`);
    if (slots.length) {
      // خلفية بدون نص "مساحة مخصصة" حتى تظهر خانة الصورة نظيفة
      await el.evaluate((pg) => pg.querySelectorAll('.slot-empty > *').forEach((c) => (c.style.visibility = 'hidden')));
      bg = path.join(OUT, `.bg-${n}.jpg`);
      await el.screenshot({ path: bg, type: 'jpeg', quality: 92 });
      await el.evaluate((pg) => pg.querySelectorAll('.slot-empty > *').forEach((c) => (c.style.visibility = '')));
    }
    info.push({ bg, slots });
  }
  await browser.close();

  const pres = new pptxgen();
  pres.defineLayout({ name: 'A4P', width: 8.27, height: 11.69 });
  pres.layout = 'A4P';
  pres.rtlMode = true;
  pres.title = 'بروشور شركة ركن الكيان';
  pres.author = 'شركة ركن الكيان للاستشارات الهندسية';

  const toIn = (v) => +(v / PX_PER_IN).toFixed(3);
  const masters = {};
  const masterFor = (slots) => {
    const key = slots.map((s) => [s.x, s.y, s.w, s.h].map(Math.round).join(',')).join('|');
    if (masters[key]) return masters[key];
    const name = `Certificates ${Object.keys(masters).length + 1}`;
    pres.defineSlideMaster({
      title: name,
      objects: slots.map((s, i) => ({
        placeholder: {
          options: { name: `cert${i + 1}`, type: 'image', x: toIn(s.x), y: toIn(s.y), w: toIn(s.w), h: toIn(s.h), color: '702820' },
          text: 'اضغطي على الأيقونة لإضافة صورة الشهادة',
        },
      })),
    });
    return (masters[key] = name);
  };

  for (const pg of info) {
    const opts = pg.slots.length ? { masterName: masterFor(pg.slots) } : {};
    const slide = pres.addSlide(opts);
    slide.background = { path: pg.bg };
  }

  const pptxPath = path.join(OUT, 'roukn-alkayan-brochure.pptx');
  await pres.writeFile({ fileName: pptxPath });

  // pptxgenjs لا يكتب type="pic" للخانات — نضيفه يدويًا حتى تظهر أيقونة "إدراج صورة" في PowerPoint
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const out = new JSZip();
  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    let data = await file.async('nodebuffer');
    if (/^ppt\/(slides|slideLayouts)\/[^/]+\.xml$/.test(name)) {
      data = Buffer.from(data.toString('utf8').replace(/<p:ph(\s+idx="\d+"\s+hasCustomPrompt="1")/g, '<p:ph type="pic"$1'));
    }
    out.file(name, data, { createFolders: false });
  }
  fs.writeFileSync(pptxPath, await out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
  for (const f of fs.readdirSync(OUT)) if (f.startsWith('.bg-')) fs.rmSync(path.join(OUT, f));
  console.log(`PPTX: ${pptxPath}\nImages: ${IMG_DIR} (${info.length})`);
})();
