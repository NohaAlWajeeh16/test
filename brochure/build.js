// بروشور شركة ركن الكيان — يولّد ملف HTML وملف PDF بمقاس A4
// التشغيل:  node brochure/build.js
// لإضافة الشهادات: ضع صورها في brochure/certificates بالأسماء cert-01 ... cert-09 (jpg/png/webp) ثم أعد التشغيل.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'output');
const CERT_DIR = path.join(ROOT, 'certificates');

/* ------------------------------------------------------------------ */
/* المحتوى (مصدره موقع roukn-alkayan.com)                              */
/* ------------------------------------------------------------------ */
const site = {
  nameAr: 'شركة ركن الكيان',
  subAr: 'للاستشارات الهندسية',
  nameEn: 'Roukn Al-Kayan Engineering Consultancy Company',
  tagline: 'استشارات هندسية • أمن وسلامة',
  taglineSub: 'حلول مبنية على الدقة والثقة.',
  phone: '053 422 4100',
  landline: '012 614 1093',
  whatsapp: '012 614 1093',
  web: 'roukn-alkayan.com',
  handle: '@ruoknalkayan',
  address: 'جدة، حي العزيزية، تقاطع غرناطة مع المكرونة، مركز سولدير، الدور الثاني، مكتب رقم 234',
  credentials: [
    { label: 'معتمد لدى الهيئة السعودية للمهندسين', numLabel: 'رقم الترخيص', num: '5100002715' },
    { label: 'معتمد لدى أمانة جدة (بلدي)', numLabel: 'رقم الترخيص', num: '4400377930' },
    { label: 'معتمد لدى الدفاع المدني (الأمن والسلامة)', numLabel: 'رقم الترخيص', num: '100000259' },
    { label: 'السجل التجاري', numLabel: 'الرقم الوطني الموحد', num: '7032491412' },
  ],
};

const START_TEXT = 'شاركنا موقع المشروع والوثائق أو المخططات المتاحة ووصف المطلوب، لنحدد نطاق العمل والمخرجات والمدة والتكلفة قبل البدء.';

const services = [
  {
    key: 'consulting', no: '01', icon: 'compass',
    title: 'استشارات هندسية',
    hl: 'حلول واضحة لكل مشروع.',
    desc: 'دراسة احتياج المشروع وتقديم توصيات تساعد على اختيار الحل الهندسي المناسب، مع خدمات هندسية متكاملة لإنجاز معاملات أمانة جدة وإصدار التراخيص والاعتمادات اللازمة وفق الأنظمة والاشتراطات البلدية، بدقة وكفاءة وسرعة في الإنجاز.',
    img: 'svc-consulting.jpg',
    groups: [
      { title: 'الاستشارات الهندسية', items: ['مراجعة المخططات والمعلومات المتاحة', 'تحديد التحديات والخيارات الفنية', 'توصيات واضحة وخطوات مقترحة', 'تخطيط مراحل المشروع والإشراف على التنفيذ'] },
      { title: 'خدمات أمانة جدة', items: ['رخص بناء (سكني – تجاري)', 'رخص هدم وترميم وإضافة وتعديل', 'تحويل من سكني إلى تجاري إداري', 'شهادة إشغال', 'شهادة امتثال'] },
      { title: 'الأعمال المساحية', items: ['رفع مساحي', 'قرارات مساحية وقرارات ذرعة', 'تحديث وتعديل صكوك', 'فرز ودمج صكوك', 'فرز وحدات وتقسيم أراضٍ', 'حساب كميات القطع الصخري والردم', 'تصحيح وضع وتحديث قطع أراضٍ', 'تحديد نقاط الإحداثيات للموقع', 'كروكيات وأراضٍ فضاء'] },
    ],
  },
  {
    key: 'safety', no: '02', icon: 'shield',
    title: 'أمن وسلامة',
    hl: 'نحمي قيمة المشروع وسلامة مستخدميه.',
    desc: 'دراسة متطلبات الأمن والسلامة في المشروع وتجهيز الأعمال الفنية ذات الصلة بالدفاع المدني واستخراج التصاريح والشهادات.',
    img: 'civil-defense.jpg',
    items: ['شهادة إنهاء ومطابقة أعمال', 'إعداد تقرير فني واعتماده', 'إعداد مخططات الإطفاء والحريق والإنذار', 'إعداد جداول الكميات والمواصفات لأعمال التنفيذ', 'الإشراف على التنفيذ والتوريد والتركيب لأدوات السلامة', 'اعتماد التقارير ومخططات السلامة من الدفاع المدني', 'إعداد الحسابات الهيدروليكية للموقع', 'إعداد تقرير دراسة للموقع'],
    note: 'معتمدون لدى المديرية العامة للدفاع المدني — ترخيص رقم 100000259',
  },
  {
    key: 'balady', no: '03', icon: 'stamp',
    title: 'اعتمادات منصة بلدي',
    hl: 'ملف هندسي جاهز للاعتماد.',
    desc: 'مراجعة وتجهيز الملفات الهندسية المطلوبة لإجراءات الاعتماد عبر منصة بلدي، ومتابعتها حتى الإنجاز.',
    img: 'balady-building.jpg',
    logo: 'balady-logo.webp',
    items: ['تدقيق المخططات والمرفقات المتاحة', 'تحديد النواقص الفنية في الملف', 'متابعة الملاحظات ضمن نطاق الخدمة'],
    steps: [
      ['نفهم', 'نحدد نوع المعاملة والمتطلبات والوثائق اللازمة.'],
      ['نجهّز', 'نُعدّ المخططات والمرفقات الهندسية المطلوبة.'],
      ['نراجع', 'نتحقق من اكتمال الملف ومطابقته للاشتراطات.'],
      ['نتابع', 'نتابع الملاحظات حتى صدور الاعتماد.'],
    ],
    note: 'معتمدون لدى أمانة محافظة جدة (بلدي) — ترخيص رقم 4400377930',
  },
  {
    key: 'hotel', no: '04', icon: 'key',
    title: 'خدمات فندقية متكاملة',
    hl: 'من التأسيس حتى آخر التفاصيل.',
    desc: 'تأسيس الفنادق بالكامل وتأثيثها وتجهيزها بكل ما تحتاجه للتشغيل، بخيارات مدروسة تجمع الجودة وراحة النزيل.',
    img: 'svc-hotel.jpg',
    items: ['تأسيس فنادق بالكامل وتأثيث', 'غرف نوم', 'كنب', 'ستائر', 'أدوات نظافة – صابون – مناشف', 'إكسسوارات – مفارش – مخدات', 'أدوات كهربائية – سخان – تلفزيون – ثلاجة – غسالة'],
  },
  {
    key: 'arch', no: '05', icon: 'building',
    title: 'تصاميم معمارية',
    hl: 'من ملامح الفكرة إلى هوية المبنى.',
    desc: 'تحويل فكرة المشروع إلى تصميم معماري يجمع بين الوظيفة والهوية وحسن استغلال المساحات.',
    img: 'svc-arch.jpg', img2: 'arch-contemporary.jpg',
    groups: [
      { title: 'أنواع المشاريع', items: ['مركز إداري تجاري', 'عمارة سكنية', 'مركز تجاري', 'فيلا دوبلكس', 'فيلا سكنية', 'محطة وقود'] },
      { title: 'التقارير', items: ['تقرير تربة', 'تقرير خرسانة', 'تقرير فني', 'تقرير معاينة'] },
      { title: 'المخططات', items: ['تصميم مخططات معمارية', 'تصميم مخططات إنشائية', 'مخططات ميكانيكية وكهربائية وكفاءة طاقة', 'إضافة أدوار وعدادات كهربائية'] },
    ],
  },
  {
    key: 'interior', no: '06', icon: 'sofa',
    title: 'تصاميم داخلية',
    hl: 'تفاصيل تعكسك، ومساحات تحتضن يومك.',
    desc: 'تصميم مساحات داخلية متناسقة تعكس هوية المكان وتخدم الاستخدام اليومي، بخامات وإضاءة وتفاصيل تخدم أسلوب الحياة.',
    img: 'svc-interior.jpg', img2: 'proj-interior.jpg', img3: 'living.jpg',
    items: ['توزيع الأثاث والحركة', 'اختيار الخامات والألوان والإضاءة', 'إعداد التصورات والتفاصيل حسب الاتفاق'],
  },
];

// صفحات الشهادات (الصور في مجلد certificates بالأسماء cert-01 ... cert-08)
const certPages = [
  { layout: 'double', slots: [{ id: 'cert-01', label: 'ترخيص الهيئة السعودية للمهندسين — ترخيص نهائي' }, { id: 'cert-02', label: 'ترخيص مزاولة نشاط — سلامة (الدفاع المدني)' }] },
  { layout: 'single', slots: [{ id: 'cert-03', label: 'رخصة نشاط تجاري — بلدي (أمانة جدة)' }] },
  { layout: 'single', slots: [{ id: 'cert-04', label: 'ترخيص الدفاع المدني — سلامة' }] },
  { layout: 'pair', slots: [{ id: 'cert-05', label: 'موافقة الهيئة العليا للأمن الصناعي' }, { id: 'cert-06', label: 'خطاب الهيئة العليا للأمن الصناعي' }] },
  { layout: 'pair', title: 'نماذج من رخص البناء الصادرة', slots: [{ id: 'cert-07', label: 'رخصة بناء — عمارة سكنية' }, { id: 'cert-08', label: 'رخصة بناء — فيلا سكنية' }] },
];

/* ------------------------------------------------------------------ */
/* أيقونات وزخارف حجازية                                              */
/* ------------------------------------------------------------------ */
const ic = {
  compass: '<path d="M12 3v3M12 6l-6 15M12 6l6 15M7.5 16h9"/><circle cx="12" cy="6" r="1.6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  stamp: '<path d="M9 3h6v5l-1.5 3h-3L9 8z"/><path d="M4 15h16v3H4zM6 21h12"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l2.5 2.5M18.5 4.5L21 7"/>',
  building: '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-5h6v5M8 10h2M14 10h2M8 13.5h2M14 13.5h2"/>',
  sofa: '<path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3"/><path d="M3 12a2 2 0 014 0v2h10v-2a2 2 0 014 0v5H3zM5 17v2M19 17v2"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2"/>',
  tel: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M11 11h2M14 11h2M8 14h2M11 14h2M14 14h2M8 17h2M11 17h2M14 17h2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ic[n]}</svg>`;

// نافذة روشان حجازية (مشربية) — عنصر زخرفي
const roshan = (cls = '', color = 'currentColor') => `
<svg class="roshan ${cls}" viewBox="0 0 120 300" fill="none" stroke="${color}" stroke-width="1.4">
  <defs>
    <pattern id="lat-${cls}" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M6 0L12 6 6 12 0 6z"/><circle cx="6" cy="6" r="1.4"/>
    </pattern>
    <clipPath id="clip-${cls}"><path d="M14 296V70Q14 22 60 12q46 10 46 58v226z"/></clipPath>
  </defs>
  <path d="M6 298V68Q6 14 60 4q54 10 54 64v230z" stroke-width="2"/>
  <path d="M14 296V70Q14 22 60 12q46 10 46 58v226z"/>
  <rect x="0" y="0" width="120" height="300" fill="url(#lat-${cls})" clip-path="url(#clip-${cls})" stroke="none" style="fill-opacity:1"/>
  <g clip-path="url(#clip-${cls})" stroke-width="2.2">
    <path d="M14 112h92M14 186h92M14 252h92M60 12v284"/>
  </g>
  <path d="M0 298h120"/>
</svg>`;

const shurfatClass = (c) => `shurfat shurfat-${c}`;

/* ------------------------------------------------------------------ */
/* أجزاء الصفحات                                                       */
/* ------------------------------------------------------------------ */
let pageNo = 0;
const img = (f) => `assets/img/${f}`;

const topbar = (section) => `
  <header class="topbar">
    <div class="brand"><span class="brand-mark"><img src="${img('company-logo.png')}" alt=""></span>
      <span><b>${site.nameAr}</b><small>${site.subAr}</small></span></div>
    <div class="section-tag"><i></i>${section}</div>
  </header>`;

const footer = () => `
  <footer class="foot">
    <div class="${shurfatClass('deep')}"></div>
    <div class="foot-in">
      <span>${icon('phone')}<bdi>${site.phone}</bdi></span>
      <span>${icon('tel')}<bdi>${site.landline}</bdi></span>
      <span>${icon('globe')}<bdi>${site.web}</bdi></span>
      <span class="pno">${String(pageNo).padStart(2, '0')}</span>
    </div>
  </footer>`;


// يرسم نقش الروشان والنجمة كخطوط فعلية على الصفحة كاملة (بدون تكرار بلاطات) حتى يطلع حاد في كل برامج PDF
const PW = 794, PH = 1123;
const roshanPath = (() => {
  const T = 44; let d = '';
  for (let x = 0; x < PW + T; x += T) for (let y = 0; y < PH + T; y += T)
    d += `M${x + 1} ${y + 1}h42v42h-42zM${x + 22} ${y + 1}L${x + 43} ${y + 22}L${x + 22} ${y + 43}L${x + 1} ${y + 22}zM${x + 27} ${y + 22}a5 5 0 1 0 -10 0a5 5 0 1 0 10 0`;
  return d;
})();
const starPath = (() => {
  const T = 64; let d = '';
  for (let x = 0; x < PW + T; x += T) for (let y = 0; y < PH + T; y += T) {
    d += `M${x + 32} ${y + 8}l7 17 17 7-17 7-7 17-7-17-17-7 17-7z`;
    d += `M${x + 18} ${y + 18}h28v28h-28z`;
    d += `M${x + 32} ${y + 12.2}L${x + 51.8} ${y + 32}L${x + 32} ${y + 51.8}L${x + 12.2} ${y + 32}z`;
  }
  return d;
})();
const bgPaper = `<svg class="bgpat" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice"><path d="${roshanPath}" fill="none" stroke="#702820" stroke-opacity=".07" stroke-width="1.2"/></svg>`;
const bgDark = `<svg class="bgpat" viewBox="0 0 ${PW} ${PH}" preserveAspectRatio="xMidYMid slice"><path d="${roshanPath}" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.2"/><path d="${starPath}" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="1.2"/></svg>`;

const page = (cls, inner, { bare = false, section = '' } = {}) => {
  pageNo += 1;
  return `<section class="page ${cls}">${bare ? '' : bgPaper}${bare ? inner : topbar(section) + `<div class="body">${inner}</div>` + footer()}</section>`;
};

const kicker = (t) => `<div class="kicker"><span class="lantern"></span>${t}</div>`;
const bullets = (items, cls = '') => `<ul class="bul ${cls}">${items.map((t) => `<li><i></i><span>${t}</span></li>`).join('')}</ul>`;
const numbered = (items) => `<ol class="num">${items.map((t, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${t}</span></li>`).join('')}</ol>`;
const startBand = () => `<div class="start"><div><b>كيف نبدأ؟</b><p>${START_TEXT}</p></div><div class="start-cta">${icon('phone')}<bdi>${site.phone}</bdi></div></div>`;

/* ---------------- الغلاف ---------------- */
const cover = () => page('r2', `
  <div class="ph"><img src="${img('svc-arch.jpg')}" alt=""></div>
  <div class="card">
    <div class="lg">
      <img src="${img('company-logo.png')}" alt="">
      <i class="dv"></i>
      <div class="nm"><b>${site.nameAr}</b><em>ROUKN AL-KAYAN</em><small><i></i>${site.subAr}</small></div>
    </div>
    <div class="star">✦</div>
  </div>
  <div class="hl"><div class="t1 X" data-fit>نُصمّـــــم</div><div class="t2 X">المساحة ونحمي قيمتهــا</div></div>
  <div class="arrow"></div>
  <div class="box X">في جدّة</div>
  <div class="feats">
    ${services.map((s) => `<div class="f"><span class="i">${icon(s.icon)}</span><span class="l"></span><span class="t">${s.title}</span></div>`).join('')}
  </div>
  <div class="ct">
    <div><span class="ci"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.6c0 3.4 3 6.4 6.4 6.4l1.2-1.6-2-1-.9.8a5 5 0 0 1-2.9-2.9l.8-.9-1-2z"/></svg></span><bdi>${site.phone}</bdi></div>
    <i></i>
    <div><span class="ci">${icon('globe')}</span><bdi>${site.web}</bdi></div>
    <i></i>
    <div><span class="ci">${icon('at')}</span><bdi>${site.handle}</bdi></div>
  </div>
`, { bare: true });

/* ---------------- المقدمة ---------------- */
const intro = () => page('intro', `
  <div class="intro-grid">
    <div>
      ${kicker('المقدمة')}
      <h2 class="h">كل مشروع يبدأ بفكرة.<span>ودورنا أن نمنحها شكلًا يستحق.</span></h2>
      <p class="lead">نربط الجمال بالوظيفة، والتخطيط بالسلامة. نعمل معك لفهم احتياجك وتطوير حلول هندسية واضحة، من التصور الأول وحتى متابعة التنفيذ.</p>
      <p class="lead muted">من الفكرة وحتى التسليم، خدمات مترابطة تقلل التعقيد وتمنح المشروع مسارًا أوضح.</p>
    </div>
    <figure class="arch tall"><img src="${img('about.jpg')}" alt=""><figcaption>التفاصيل الصغيرة تصنع تجربة متكاملة.</figcaption></figure>
  </div>
  <div class="trust">
    <div>${icon('shield')}<b>معتمد</b><small>لدى أمانة جدة</small></div>
    <div>${icon('flag')}<b>معتمد</b><small>لدى الدفاع المدني</small></div>
    <div>${icon('building')}<b>+120</b><small>مشروع منجز</small></div>
    <div>${icon('doc')}<b>+16</b><small>خدمة هندسية متكاملة</small></div>
  </div>
  <div class="process">
    <div class="process-head">${kicker('كيف نعمل')}<h3>مسار واضح من البداية.</h3><p>أربع مراحل، ولكل مرحلة مخرج تستلمه وتراجعه قبل أن ننتقل للتي بعدها.</p></div>
    <div class="steps">
      ${[['نفهم', 'نزور الموقع ونسمع منك، ونحدد الاحتياج والنطاق والقيود قبل أي اقتراح.', 'اجتماع ونطاق عمل مكتوب'],
         ['نصمم', 'نحوّل المتطلبات إلى مخططات وحل هندسي مدروس وقابل للتنفيذ.', 'مخططات وتصورات للمراجعة'],
         ['نراجع', 'نتحقق من التفاصيل ومتطلبات السلامة والأنظمة قبل الاعتماد.', 'ملف جاهز للاعتماد'],
         ['نشرف', 'نتابع التنفيذ في الموقع حتى تتطابق النتيجة مع المعتمد.', 'متابعة حتى التسليم']]
        .map(([t, d, o], i) => `<div class="step"><span class="sn">0${i + 1}</span><b>${t}</b><p>${d}</p><small>${o}</small></div>`).join('')}
    </div>
  </div>
`, { section: 'المقدمة' });

/* ---------------- من نحن / الرؤية / الرسالة ---------------- */
const about = () => page('about', `
  ${kicker('ركن الكيان')}
  <h2 class="h">من نحن<span>مكتب استشارات هندسية في جدة يجمع التصميم المعماري والداخلي والأمن والسلامة في مسار واحد واضح.</span></h2>
  <div class="about-card">
    <p>شركة ركن الكيان للاستشارات الهندسية، شركة هندسية استشارية سعودية معتمدة لدى <b>الهيئة السعودية للمهندسين</b> و<b>أمانة جدة</b> و<b>الدفاع المدني</b> و<b>منصة بلدي</b>، تقدم خدماتها الاستشارية في عدة مجالات هندسية، منها استخراج التراخيص الهندسية الكاملة، وأعمال الأمن والسلامة، والتصاميم المعمارية والإنشائية، وتخطيط وتنسيق الموقع، والتصميم الداخلي، والأعمال المساحية ونظم المعلومات الجغرافية، وإدارة المشاريع والتصميم والإشراف على المباني.</p>
  </div>
  <div class="vm">
    <article>
      <div class="vm-h">${icon('eye')}<h3>رؤيتنا</h3></div>
      <p>تحرص شركة ركن الكيان على تحقيق تصاميم معمارية اقتصادية تتلاقى مع أهداف <b>رؤية المملكة العربية السعودية 2030</b>، وتؤازر التقنيات والأساليب الحديثة لتحقيق التوازن المدروس الدقيق الإبداعي الذي يتماشى مع متطلبات العملاء واهتماماتهم، وهو ما يؤثر إيجابًا على الدقة والإبداع في التصميم. ونسعى دائمًا لأن تصبح شركة ركن الكيان رائدة في مجال الهندسة المدنية والعمرانية والأمن والسلامة على مستوى المملكة العربية السعودية.</p>
    </article>
    <article>
      <div class="vm-h">${icon('flag')}<h3>رسالتنا</h3></div>
      <p>تجتهد شركة ركن الكيان في تقديم خدمات الدفاع المدني والهندسة المعمارية عالية الجودة، من خلال تطبيق <b>كود البناء السعودي</b> والمعايير العالمية بما يحقق قيمة اقتصادية تنافسية للعملاء، والإسهام الفعّال في بناء غدٍ مشرق لمستقبل الأعمال الهندسية والاستشارية، وتقديم معطيات الإتقان والجودة والدقة للوصول إلى الريادة بمفهوم التميز في الخدمات الهندسية والفنية والاستشارية على مستوى المملكة العربية السعودية.</p>
    </article>
  </div>
  <div class="values">
    <div><span>01</span><b>تصاميم معمارية</b><small>فراغات متوازنة وهوية تنتمي للمكان.</small></div>
    <div><span>02</span><b>تصاميم داخلية</b><small>خامات وإضاءة وتفاصيل تخدم أسلوب الحياة.</small></div>
    <div><span>03</span><b>أمن وسلامة</b><small>حلول مدروسة تجعل السلامة جزءًا من التصميم.</small></div>
  </div>
`, { section: 'من نحن' });

/* ---------------- صفحات الخدمات ---------------- */
const servicePage = (s) => {
  const head = `
    <div class="svc-head">
      <div class="svc-no"><span>${s.no}</span><small>خدماتنا</small></div>
      <div class="svc-title">${kicker('ماذا نقدم')}
        <h2 class="h">${s.title}<span>${s.hl}</span></h2>
      </div>
      <div class="svc-icon">${icon(s.icon)}</div>
    </div>
    <p class="lead">${s.desc}</p>`;

  let body = '';
  if (s.key === 'consulting') {
    body = `
      <div class="svc-media short"><figure class="arch wide"><img src="${img(s.img)}" alt=""></figure>
        <figure class="arch wide"><img src="${img('svc-jeddah.jpg')}" alt=""></figure></div>
      <h4 class="sub">أنواع الخدمات</h4>
      <div class="groups g3">${s.groups.map((g) => `<div class="group"><h5>${g.title}</h5>${bullets(g.items)}</div>`).join('')}</div>`;
  } else if (s.key === 'safety') {
    body = `
      <div class="split">
        <div><h4 class="sub">ماذا تشمل الخدمة؟</h4>${numbered(s.items)}</div>
        <figure class="arch tall"><img src="${img(s.img)}" alt=""></figure>
      </div>
      <div class="note">${icon('shield')}${s.note}</div>`;
  } else if (s.key === 'balady') {
    body = `
      <div class="balady-hero"><figure class="arch wide"><img src="${img(s.img)}" alt=""></figure>
        <div class="balady-logo"><img src="${img(s.logo)}" alt="بلدي"></div></div>
      <div class="split even">
        <div><h4 class="sub">ماذا تشمل الخدمة؟</h4>${numbered(s.items)}</div>
        <div><h4 class="sub">مراحل العمل</h4><div class="mini-steps">${s.steps.map(([t, d], i) => `<div><span>0${i + 1}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div></div>
      </div>
      <div class="note">${icon('stamp')}${s.note}</div>`;
  } else if (s.key === 'hotel') {
    body = `
      <div class="svc-media one"><figure class="arch wide"><img src="${img(s.img)}" alt=""></figure></div>
      <h4 class="sub">ماذا تشمل الخدمة؟</h4>
      <div class="tiles">${s.items.map((t, i) => `<div class="${i === 0 ? 'wide' : ''}"><span>${String(i + 1).padStart(2, '0')}</span>${t}</div>`).join('')}</div>`;
  } else if (s.key === 'arch') {
    body = `
      <div class="svc-media"><figure class="arch wide"><img src="${img(s.img)}" alt=""></figure><figure class="arch wide"><img src="${img(s.img2)}" alt=""></figure></div>
      <h4 class="sub">ماذا تشمل الخدمة؟</h4>
      <div class="groups g3">${s.groups.map((g) => `<div class="group"><h5>${g.title}</h5>${bullets(g.items)}</div>`).join('')}</div>`;
  } else if (s.key === 'interior') {
    body = `
      <div class="mosaic"><figure class="arch tall"><img src="${img(s.img2)}" alt=""></figure>
        <div><figure class="arch wide"><img src="${img(s.img)}" alt=""></figure><figure class="arch wide"><img src="${img(s.img3)}" alt=""></figure></div></div>
      <h4 class="sub">ماذا تشمل الخدمة؟</h4>
      <div class="cards3">${s.items.map((t, i) => `<div><span>0${i + 1}</span><b>${t}</b></div>`).join('')}</div>`;
  }
  return page(`svc svc-${s.key}`, head + body + startBand(), { section: `خدماتنا · ${s.title}` });
};

/* ---------------- فاصل الخدمات ---------------- */
const servicesDivider = () => page('divider', `
  <div class="cover-pattern">${bgDark}</div>
  <div class="div-in">
    ${roshan('dv', '#ead9bd')}
    <div>
      <span class="pill">خدماتنا</span>
      <h2>خبرات متكاملة<br><span>لمشروعك القادم.</span></h2>
      <p>من الفكرة وحتى التسليم، خدمات مترابطة تقلل التعقيد وتمنح المشروع مسارًا أوضح.</p>
      <ol class="div-list">${services.map((s) => `<li><b>${s.no}</b>${s.title}</li>`).join('')}</ol>
    </div>
  </div>
  <div class="cover-bottom"><div class="${shurfatClass('paper')}"></div><div class="cover-bottom-in"><span>${icon('globe')}<bdi>${site.web}</bdi></span><span class="pno">${String(pageNo + 1).padStart(2, '0')}</span></div></div>
`, { bare: true });


/* ---------------- عملاؤنا ---------------- */
const clients = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/clients/clients.json'), 'utf8'));
const clientsPage = () => page('clients', `
  ${kicker('من بعض عملائنا')}
  <h2 class="h">ثقة نعتز بها.<span>شركاء في مسيرة العمل والإنجاز.</span></h2>
  <div class="cl-grid">${clients.map((c) => `
    <div class="cl"><div class="cl-logo">${c.file ? `<img src="assets/clients/${c.file}" alt="${c.ar}">` : `<span class="cl-txt">${c.ar}</span>`}</div><b>${c.ar}</b></div>`).join('')}
  </div>
`, { section: 'عملاؤنا' });

/* ---------------- الشهادات ---------------- */
const findCert = (id) => {
  if (!fs.existsSync(CERT_DIR)) return null;
  const f = fs.readdirSync(CERT_DIR).find((n) => n.replace(/\.[^.]+$/, '') === id && /\.(jpe?g|png|webp)$/i.test(n));
  return f ? `certificates/${f}` : null;
};

const certIntro = () => page('cert-intro', `
  ${kicker('تراخيص وشهادات الشركة')}
  <h2 class="h">اعتمادات نعتز بها.<span>شركة ذات مسؤولية محدودة — معتمدة لدى الجهات الرسمية في المملكة.</span></h2>
  <div class="creds">${site.credentials.map((c, i) => `
    <div class="cred"><span class="cn">0${i + 1}</span><b>${c.label}</b><small>${c.numLabel}</small><bdi>${c.num}</bdi></div>`).join('')}
  </div>
  <div class="cert-index">
    <h4 class="sub">محتوى قسم الشهادات</h4>
    <ol>${certPages.flatMap((p) => p.slots).map((s) => `<li>${s.label}</li>`).join('')}</ol>
  </div>
  ${roshan('ci', '#702820')}
`, { section: 'التراخيص والشهادات' });

const certPage = (p) => page(`cert cert-${p.layout}`, `
  ${p.title ? `<h4 class="sub">${p.title}</h4>` : ''}
  <div class="cert-slots">${p.slots.map((s) => {
    const f = findCert(s.id);
    return `<figure class="slot ${f ? 'filled' : ''}">
      ${f ? `<img src="${f}" alt="${s.label}">` : `<div class="slot-empty">${icon('doc')}<b>مساحة مخصصة للشهادة</b><small>${s.id}</small></div>`}
      <figcaption>${s.label}</figcaption></figure>`;
  }).join('')}</div>
`, { section: 'التراخيص والشهادات' });

/* ---------------- الغلاف الخلفي ---------------- */
const back = () => page('back', `
  <div class="cover-pattern">${bgDark}</div>
  <div class="back-in">
    <div class="cover-logo big"><img src="${img('company-logo.png')}" alt=""></div>
    <h1>${site.nameAr}</h1><p class="sub-name">${site.subAr}</p>
    <p class="tag">${site.tagline}<br><span>${site.taglineSub}</span></p>
    <h2>جاهز تبدأ مشروعك؟</h2>
    <p class="muted-l">كلّمنا على واتساب أو اتصل بنا، ونرتّب معك الخطوة الجاية بوضوح.</p>
    <div class="contact-grid">
      <div>${icon('phone')}<small>اتصال</small><bdi>${site.phone}</bdi></div>
      <div>${icon('tel')}<small>الرقم الثابت / واتساب</small><bdi>${site.landline}</bdi></div>
      <div>${icon('globe')}<small>الموقع الإلكتروني</small><bdi>${site.web}</bdi></div>
      <div>${icon('at')}<small>تابعنا</small><bdi>${site.handle}</bdi></div>
    </div>
    <div class="addr">${icon('pin')}<span>${site.address}</span></div>
    <div class="qrs">
      <div><img src="${img('qr-site.svg')}" alt=""><small>الموقع الإلكتروني</small></div>
      <div><img src="${img('qr-whatsapp.svg')}" alt=""><small>واتساب</small></div>
    </div>
  </div>
  <div class="cover-bottom"><div class="${shurfatClass('paper')}"></div>
    <div class="back-creds">${site.credentials.map((c) => `<div><b>${c.label}</b><small>${c.numLabel}: <bdi>${c.num}</bdi></small></div>`).join('')}</div>
  </div>
`, { bare: true });

/* ------------------------------------------------------------------ */
const pages = [cover(), intro(), about(), servicesDivider(), ...services.map(servicePage), clientsPage(), certIntro(), ...certPages.map(certPage), back()];

const css = fs.readFileSync(path.join(ROOT, 'brochure.css'), 'utf8');
const html = `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>بروشور ركن الكيان</title>
<style>${css}</style></head>
<body><svg width="0" height="0" style="position:absolute"><defs>
<pattern id="pat-paper" width="44" height="44" patternUnits="userSpaceOnUse"><g fill="none" stroke="#702820" stroke-opacity=".07" stroke-width="1.2"><rect x="1" y="1" width="42" height="42"/><path d="M22 1 43 22 22 43 1 22z"/><circle cx="22" cy="22" r="5"/></g></pattern>
<pattern id="pat-light" width="44" height="44" patternUnits="userSpaceOnUse"><g fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.2"><rect x="1" y="1" width="42" height="42"/><path d="M22 1 43 22 22 43 1 22z"/><circle cx="22" cy="22" r="5"/></g></pattern>
<pattern id="pat-star" width="64" height="64" patternUnits="userSpaceOnUse"><g fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="1.2"><path d="M32 8l7 17 17 7-17 7-7 17-7-17-17-7 17-7z"/><rect x="18" y="18" width="28" height="28" transform="rotate(45 32 32)"/><rect x="18" y="18" width="28" height="28"/></g></pattern>
</defs></svg>${pages.join('\n')}
<script>
document.fonts.ready.then(() => document.querySelectorAll('[data-fit]').forEach((el) => {
  const target = el.nextElementSibling.getBoundingClientRect().width;
  const base = el.textContent.replace(/ـ/g, '');
  let best = 1;
  for (let n = 1; n < 40; n++) { el.textContent = base.slice(0, 5) + 'ـ'.repeat(n) + base.slice(5); if (el.getBoundingClientRect().width <= target) best = n; else break; }
  el.textContent = base.slice(0, 5) + 'ـ'.repeat(best) + base.slice(5);
  const w = el.getBoundingClientRect().width;
  el.style.transformOrigin = 'right center'; el.style.transform = 'scaleX(' + (target / w) + ')';
  // توسيط العنوان بين سطر الشعار وسطر السهم
  const hl = el.parentElement, pg = hl.closest('section').getBoundingClientRect();
  const top = hl.closest('section').querySelector('.card .lg').getBoundingClientRect().bottom;
  const bottom = hl.closest('section').querySelector('.box').getBoundingClientRect().top;
  const hh = hl.getBoundingClientRect().height;
  const mm = 96 / 25.4; // تعويض الضمة والشدة فوق السطر
  hl.style.top = ((top + bottom) / 2 - hh / 2 - pg.top + 5.2 * mm) + 'px';
  document.body.dataset.fitted = '1';
}));
</script></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const htmlPath = path.join(ROOT, 'brochure.html');
fs.writeFileSync(htmlPath, html);
console.log(`HTML: ${htmlPath} (${pages.length} pages)`);

if (process.argv.includes('--no-pdf')) process.exit(0);
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const p = await browser.newPage();
  await p.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const pdfPath = path.join(OUT, 'roukn-alkayan-brochure.pdf');
  await p.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  if (process.argv.includes('--png')) {
    await p.setViewportSize({ width: 794, height: 1123 });
    const els = await p.$$('section.page');
    fs.mkdirSync(path.join(OUT, 'preview'), { recursive: true });
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(OUT, 'preview', `page-${String(i + 1).padStart(2, '0')}.png`) });
  }
  await browser.close();
  console.log(`PDF: ${pdfPath}`);
})();
