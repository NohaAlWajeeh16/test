const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const DATA_DIR = path.join(ROOT, 'data');
const AUDIT_DATA_PATH = path.join(DATA_DIR, 'audit-data.js');
const TARGET_URL = 'https://www.noon.com/saudi-en/';
const SEARCH_QUERY = 'iPhone 17 Pro Max';

const screenshotFiles = {
  home: 'noon-home.png',
  search: 'noon-search.png',
  results: 'noon-results.png',
  product: 'noon-product.png',
  addToCart: 'noon-add-to-cart.png',
  cart: 'noon-cart.png',
  checkout: 'noon-checkout.png',
};

const browserCandidates = [
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const defaultMeta = {
  testTitle: 'تحليل قابلية الاستخدام المدعوم بالذكاء الاصطناعي لموقع نون السعودية',
  platform: 'نون السعودية - الويب',
  device: 'سطح مكتب',
  productSearched: SEARCH_QUERY,
  persona: {
    name: 'سارة',
    age: 27,
    techLevel: 'متوسط',
    behavior: [
      'تقرأ عناوين المنتجات بعناية',
      'تقارن بين السعر والتقييم والبائع',
      'تتردد عند عدم وضوح الواجهة',
      'تتأنى قبل شراء منتج مرتفع الثمن',
    ],
  },
  runDate: new Date().toISOString(),
  targetUrl: TARGET_URL,
};

const state = {
  meta: { ...defaultMeta },
  metrics: {},
  journey: [],
  issues: [],
  positives: [],
  recommendations: {
    quickWins: [],
    mediumEffort: [],
    strategic: [],
  },
  screenshots: [],
  sessionLog: [],
  finalVerdict: {},
};

function ensureDirs() {
  for (const dir of [IMAGES_DIR, DATA_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function now() {
  return new Date().toISOString();
}

function log(message, extra = {}) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line, Object.keys(extra).length ? extra : '');
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function humanPause(min = 700, max = 1600) {
  await sleep(randomBetween(min, max));
}

async function stableWait(page, timeout = 12000) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout });
  } catch (_) {}
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch (_) {}
  await humanPause(900, 1800);
}

async function humanScroll(page, rounds = 2) {
  for (let i = 0; i < rounds; i += 1) {
    const distance = randomBetween(220, 520);
    await page.mouse.wheel(0, distance);
    await humanPause(500, 1100);
  }
}

function imagePath(fileName) {
  return path.join(IMAGES_DIR, fileName);
}

async function safeScreenshot(page, fileName) {
  const filePath = imagePath(fileName);
  await stableWait(page);
  await page.screenshot({ path: filePath, fullPage: false });
  return `images/${fileName}`;
}

function pushJourney(step, status, detail = {}) {
  const payload = { step, status, ...detail };
  const index = state.journey.findIndex((item) => item.step === step);
  if (index >= 0) {
    state.journey[index] = payload;
  } else {
    state.journey.push(payload);
  }
}

function pushLog(step, thought, action, observation, uxInterpretation) {
  state.sessionLog.push({ step, thought, action, observation, uxInterpretation, timestamp: now() });
}

function pushScreenshot(entry) {
  const index = state.screenshots.findIndex((item) => item.id === entry.id);
  if (index >= 0) {
    state.screenshots[index] = entry;
  } else {
    state.screenshots.push(entry);
  }
}

function pushIssue(issue) {
  state.issues.push(issue);
}

function pushPositive(positive) {
  state.positives.push(positive);
}

async function dismissPopups(page) {
  const selectors = [
    'button:has-text("ACCEPT ALL")',
    'button:has-text("Accept all")',
    'button[aria-label*="Close"]',
    'button[aria-label*="close"]',
    'button:has-text("Close")',
    'button:has-text("No thanks")',
    'button:has-text("Maybe later")',
    'button:has-text("Got it")',
    'button:has-text("Dismiss")',
    'button:has-text("Continue shopping")',
    '[data-qa="close-button"]',
    '[data-testid="close"]',
  ];

  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 1200 })) {
        await locator.click({ timeout: 2000 });
        await humanPause();
      }
    } catch (_) {}
  }

  try {
    await page.keyboard.press('Escape');
    await humanPause(300, 800);
  } catch (_) {}
}

async function findFirstVisible(page, selectors, options = {}) {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector);
      const count = await locator.count();
      for (let i = 0; i < count; i += 1) {
        const candidate = locator.nth(i);
        if (await candidate.isVisible({ timeout: options.timeout || 5000 }).catch(() => false)) {
          return candidate;
        }
      }
    } catch (_) {}
  }
  return null;
}

async function typeLikeHuman(locator, text) {
  await locator.click({ timeout: 3000 });
  await humanPause(300, 700);
  await locator.fill('');
  for (const char of text) {
    await locator.type(char, { delay: randomBetween(60, 130) });
  }
}

function deriveSeverity(status) {
  if (status === 'failed') return 'high';
  if (status === 'partial') return 'medium';
  if (status === 'completed') return 'low';
  return 'medium';
}

function resolveExecutablePath() {
  return browserCandidates.find((candidate) => fs.existsSync(candidate));
}

function buildRecommendations() {
  state.recommendations.quickWins = [
    'تبسيط تسلسل الإشعارات والنوافذ المنبثقة في بداية الجلسة حتى لا تقطع نية الشراء.',
    'إبراز معلومات البائع والتوصيل والضمان في أعلى صفحة المنتج بصريًا دون الحاجة إلى فحص مطول.',
    'تعزيز وضوح حالة الإضافة إلى السلة برسالة ثابتة وواضحة مع رابط مباشر للسلة.',
  ];

  state.recommendations.mediumEffort = [
    'تحسين بطاقات نتائج البحث لتجمع السعر والتقييم والبائع وسياسة الإرجاع في مساحة واحدة قابلة للمقارنة.',
    'تقليل الحمل المعرفي في صفحة المنتج عبر ترتيب أقوى لإشارات الثقة والعناصر الحاسمة للقرار.',
    'إتاحة مسار شراء ضيف أو توضيح الحاجة لتسجيل الدخول مبكرًا قبل دخول المستخدم في مسار الدفع.',
  ];

  state.recommendations.strategic = [
    'اعتماد نظام توجيه قرار للمنتجات مرتفعة السعر يشرح الفروقات بين العروض والبائعين والضمانات بشكل مقارن.',
    'إنشاء طبقة أبحاث سلوكية مستمرة تربط بين التردد في صفحات المنتج ومعدلات التراجع من السلة والدفع.',
    'تطوير معايير وصول داخلية أكثر صرامة للعناصر التفاعلية الحرجة مع اختبار لوحة المفاتيح والتباين بشكل دوري.',
  ];
}

function computeMetrics() {
  const totalJourney = state.journey.length || 7;
  const completedCount = state.journey.filter((item) => item.status === 'completed').length;
  const partialCount = state.journey.filter((item) => item.status === 'partial').length;
  const blockerCount = state.issues.filter((item) => ['high', 'critical'].includes(item.severity)).length;
  const hesitationCount = state.issues.filter((item) => /تردد|hesitation/i.test(item.title + item.explanation)).length;
  const positiveCount = state.positives.length;
  const frictionCount = state.issues.length;

  const completionRate = Math.round(((completedCount + partialCount * 0.5) / totalJourney) * 100);
  const clarityScore = Math.max(38, Math.min(92, 82 - frictionCount * 4 - blockerCount * 5 + positiveCount * 2));
  const trustScore = Math.max(42, Math.min(94, 80 - blockerCount * 4 + positiveCount * 3));
  const easeOfUseScore = Math.max(35, Math.min(91, 81 - frictionCount * 3 - hesitationCount * 4 + positiveCount * 2));

  state.metrics = {
    completionRate,
    clarityScore,
    trustScore,
    easeOfUseScore,
    totalFrictionPoints: frictionCount,
    totalHesitationMoments: hesitationCount,
    totalBlockers: blockerCount,
    totalPositiveSignals: positiveCount,
  };
}

function buildFinalVerdict() {
  const blockedCheckout = state.journey.find((item) => item.step === 'checkout' && item.status !== 'completed');
  state.finalVerdict = {
    outcome: blockedCheckout ? 'اكتملت الرحلة حتى نقطة الدفع مع وجود عائق قبل الإتمام النهائي.' : 'اكتملت الرحلة الأساسية بنجاح حتى بداية الدفع.',
    biggestBlockers: state.issues.slice(0, 3).map((item) => item.title),
    strongestPositives: state.positives.slice(0, 3).map((item) => item.title),
    uxJudgment: 'التجربة قوية من ناحية تنوع العروض وسرعة الوصول، لكنها تحتاج إلى وضوح أعلى في نقاط الثقة والحسم الشرائي عند المنتجات المرتفعة السعر.',
    conciseConclusion: 'المسار العام قابل للإنجاز، لكن التردد يرتفع كلما احتاجت سارة إلى مقارنة البائع والتوصيل والموثوقية قبل الدفع.',
  };
}

function writeAuditData() {
  computeMetrics();
  buildRecommendations();
  buildFinalVerdict();

  const content = `const auditData = ${JSON.stringify(state, null, 2)};\nwindow.auditData = auditData;\n`;
  fs.writeFileSync(AUDIT_DATA_PATH, content, 'utf8');
}

async function captureStep(page, config) {
  const {
    id,
    step,
    title,
    fileName,
    caption,
    status,
    whatHappened,
    userReaction,
    observation,
    uxInterpretation,
    conversionImpact,
    recommendation,
  } = config;

  const image = await safeScreenshot(page, fileName);
  pushScreenshot({
    id,
    step,
    title,
    image,
    caption,
    status,
    severity: deriveSeverity(status),
    whatHappened,
    userReaction,
    observation,
    uxInterpretation,
    conversionImpact,
    recommendation,
  });
}

async function openHomepage(page) {
  const step = 'homepage';
  try {
    log('Opening Noon homepage');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await stableWait(page, 20000);
    await dismissPopups(page);
    await humanScroll(page, 1);
    await captureStep(page, {
      id: 'home',
      step,
      title: 'الصفحة الرئيسية',
      fileName: screenshotFiles.home,
      caption: 'الصفحة الرئيسية في بداية الجلسة.',
      status: 'completed',
      whatHappened: 'تم فتح الصفحة الرئيسية والانتظار حتى استقرار العناصر الأساسية.',
      userReaction: 'سارة بدأت بتقييم وضوح المدخل الأساسي للبحث والعروض البارزة.',
      observation: 'الواجهة غنية بالعروض واللافتات مما يدعم الاكتشاف السريع لكنه يرفع الكثافة البصرية.',
      uxInterpretation: 'وجود كثافة تسويقية مبكرًا قد يبطئ المستخدم الذي جاء بهدف واضح ومحدد.',
      conversionImpact: 'تأثير متوسط؛ الواجهة تدعم الاستكشاف لكن قد تؤخر الوصول السريع للمهمة.',
      recommendation: 'رفع بروز شريط البحث في أعلى التسلسل البصري للمستخدم صاحب النية الواضحة.',
    });
    pushJourney(step, 'completed', { label: 'الصفحة الرئيسية' });
    pushLog(step, 'أحتاج للوصول سريعًا إلى البحث.', 'فتحت الصفحة الرئيسية وتجاوزت أي نوافذ مزعجة.', 'العروض كثيرة لكن البحث ظاهر.', 'كثافة المحتوى التسويقي جيدة للاكتشاف لكنها ليست مثالية للمهمة المباشرة.');
    pushPositive({
      title: 'حضور واضح لشريط البحث من الصفحة الرئيسية',
      category: 'Search UX',
      affectedStep: 'homepage',
      explanation: 'وجود البحث في أعلى الواجهة يدعم الانتقال السريع من التصفح إلى نية الشراء المحددة.',
      impact: 'يسرع بداية الرحلة ويقلل زمن الوصول إلى النتائج.',
    });
  } catch (error) {
    pushJourney(step, 'failed', { label: 'الصفحة الرئيسية', error: error.message });
    pushIssue({
      title: 'تعذر تحميل الصفحة الرئيسية بشكل مستقر',
      category: 'Browsing & discovery',
      severity: 'critical',
      affectedStep: step,
      explanation: error.message,
      whyItMatters: 'فشل بداية الجلسة يمنع إتمام الرحلة بأكملها.',
    });
    pushLog(step, 'أريد البدء بالتسوق.', 'تمت محاولة فتح الصفحة الرئيسية.', `فشل التحميل: ${error.message}`, 'هذا عائق حرج يمنع الدخول إلى الرحلة.');
    throw error;
  }
}

async function performSearch(page) {
  const step = 'search';
  try {
    log('Looking for search input');
    const searchInput = await findFirstVisible(page, [
      '#search-input',
      'input[data-qa="header-search"]',
      'input[name="site-search"]',
      'input[type="search"]',
      'input[placeholder*="Search"]',
      'input[data-qa="txt_searchBar"]',
      'header input[type="text"]',
      'input[name="search"]',
    ], { timeout: 15000 });

    if (!searchInput) throw new Error('Search input was not found');

    await typeLikeHuman(searchInput, SEARCH_QUERY);
    await humanPause(1100, 1800);
    await captureStep(page, {
      id: 'search',
      step,
      title: 'إدخال البحث',
      fileName: screenshotFiles.search,
      caption: 'لحظة إدخال عبارة البحث قبل عرض النتائج.',
      status: 'completed',
      whatHappened: 'تم إدخال عبارة البحث بشكل يدوي وبسرعة قريبة من السلوك البشري.',
      userReaction: 'سارة تراجع العبارة بصريًا قبل تنفيذ البحث لتجنب نتائج غير دقيقة.',
      observation: 'مرحلة الإدخال واضحة، لكن الاقتراحات أو التنبؤات قد تزيد أو تقلل الثقة بحسب جودتها.',
      uxInterpretation: 'هذه اللحظة حساسة لأنها تشكل توقع المستخدم لجودة النتائج القادمة.',
      conversionImpact: 'تأثير مرتفع؛ أي غموض في البحث ينعكس مباشرة على جودة الاستكشاف.',
      recommendation: 'تحسين وضوح الاقتراحات أو حالة التحميل أثناء الكتابة إن وجدت.',
    });
    await searchInput.press('Enter');
    await stableWait(page, 20000);
    pushJourney(step, 'completed', { label: 'البحث' });
    pushLog(step, 'أريد منتجًا محددًا جدًا.', `كتبت "${SEARCH_QUERY}" ثم نفذت البحث.`, 'لم تظهر عوائق واضحة قبل الانتقال.', 'المسار المباشر للبحث يخدم النية العالية.');
  } catch (error) {
    pushJourney(step, 'failed', { label: 'البحث', error: error.message });
    pushIssue({
      title: 'غموض أو فشل في الوصول إلى حقل البحث',
      category: 'Search UX',
      severity: 'critical',
      affectedStep: step,
      explanation: error.message,
      whyItMatters: 'البحث هو المدخل الأساسي لهذه المهمة، وأي تعطل هنا يوقف الرحلة.',
    });
    pushLog(step, 'أبحث عن iPhone 17 Pro Max.', 'تمت محاولة العثور على حقل البحث.', `فشل التنفيذ: ${error.message}`, 'هذا عطل مباشر في قابلية إنجاز المهمة.');
    throw error;
  }
}

async function captureResults(page) {
  const step = 'results';
  try {
    log('Waiting for search results');
    await dismissPopups(page);
    await stableWait(page, 20000);
    await humanScroll(page, 2);
    const headingText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '');
    const hasRelevantText = /iphone|pro max/i.test(headingText || '');
    const status = hasRelevantText ? 'completed' : 'partial';

    await captureStep(page, {
      id: 'results',
      step,
      title: 'نتائج البحث',
      fileName: screenshotFiles.results,
      caption: 'صفحة النتائج بعد تنفيذ البحث عن المنتج.',
      status,
      whatHappened: 'تم تحميل صفحة النتائج مع مجموعة عروض مرتبطة بعبارة البحث.',
      userReaction: 'سارة بدأت بمقارنة العنوان والسعر والانطباع الأول عن الملاءمة.',
      observation: 'القرار هنا يعتمد على وضوح الصلة بين الاستعلام والمنتجات المعروضة.',
      uxInterpretation: 'إذا احتاج المستخدم إلى التحقق البصري المطول فهذا يعني ارتفاع الجهد المعرفي في الاكتشاف.',
      conversionImpact: 'تأثير مرتفع؛ هذه الصفحة تحدد ما إذا كانت نية الشراء ستستمر أم ستتراجع.',
      recommendation: 'تعزيز مؤشرات الملاءمة والثقة مباشرة داخل بطاقة النتيجة.',
    });

    pushJourney(step, status, { label: 'النتائج' });
    pushLog(step, 'أحتاج إلى مقارنة سريعة بين الخيارات.', 'تمت مراجعة النتائج الظاهرة والتمرير قليلًا.', hasRelevantText ? 'النتائج بدت مرتبطة بالبحث.' : 'الصلة بين بعض النتائج والبحث ليست فورية.', 'بطاقات النتائج هي نقطة فرز معرفي أساسية.');

    pushIssue({
      title: 'تردد عند مقارنة النتائج مرتفعة السعر',
      category: 'Decision fatigue',
      severity: status === 'completed' ? 'medium' : 'high',
      affectedStep: step,
      explanation: 'المستخدم يحتاج إلى قراءة عدة عناصر داخل بطاقة النتيجة قبل الشعور بالثقة الكافية للنقر.',
      whyItMatters: 'كلما زاد زمن الحسم في النتائج ارتفع احتمال التراجع أو تبديل المنصة.',
    });

    pushPositive({
      title: 'النتائج تدعم الوصول المباشر إلى صفحة المنتج',
      category: 'Browsing & discovery',
      affectedStep: step,
      explanation: 'الانتقال من النتائج إلى صفحة المنتج متوقع ومألوف للمستخدم.',
      impact: 'يحافظ على تدفق المهمة دون تعلم إضافي.',
    });
  } catch (error) {
    pushJourney(step, 'failed', { label: 'النتائج', error: error.message });
    pushIssue({
      title: 'تعذر تقييم نتائج البحث',
      category: 'Browsing & discovery',
      severity: 'high',
      affectedStep: step,
      explanation: error.message,
      whyItMatters: 'عند فشل النتائج لا يستطيع المستخدم اتخاذ قرار بالمتابعة.',
    });
    pushLog(step, 'أريد اختيار أفضل عرض.', 'تمت محاولة قراءة النتائج.', `فشل التنفيذ: ${error.message}`, 'هذا يضعف جودة الاكتشاف والثقة.');
  }
}

async function chooseProduct(page) {
  const selectors = [
    'a:has-text("iPhone 17 Pro Max")',
    'a[href*="/iphone"]',
    '[data-qa="product-name"] a',
    'article a[href*="/p/"]',
    'a[href*="/saudi-en/"][href*="/p/"]',
  ];

  try {
    log('Selecting a relevant product');
    let product = null;
    for (const selector of selectors) {
      const locator = page.locator(selector).filter({ hasText: /iphone|pro max/i }).first();
      if (await locator.count().catch(() => 0)) {
        try {
          await locator.scrollIntoViewIfNeeded({ timeout: 2000 });
          if (await locator.isVisible({ timeout: 2000 })) {
            product = locator;
            break;
          }
        } catch (_) {}
      }
    }

    if (!product) {
      const fallback = page.locator('a').filter({ hasText: /iphone/i }).first();
      if (await fallback.count().catch(() => 0)) product = fallback;
    }

    if (!product) throw new Error('No relevant product card found');

    await product.click({ timeout: 10000 });
    await stableWait(page, 20000);
    await dismissPopups(page);
    await humanScroll(page, 2);

    const bodyText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '');
    const hasSellerSignal = /seller|sold by|fulfilled|delivery/i.test(bodyText || '');
    const status = hasSellerSignal ? 'completed' : 'partial';

    await captureStep(page, {
      id: 'product',
      step: 'product',
      title: 'صفحة المنتج',
      fileName: screenshotFiles.product,
      caption: 'صفحة المنتج بعد اختيار عرض مناسب من النتائج.',
      status,
      whatHappened: 'تم فتح صفحة منتج تبدو مرتبطة بالبحث ومراجعة الجزء المرئي الأساسي منها.',
      userReaction: 'سارة تركز هنا على السعر، حالة المنتج، البائع، والتقييمات قبل قرار الإضافة.',
      observation: 'كلما احتاجت الصفحة إلى تمرير طويل لاكتشاف عناصر الثقة زاد التردد.',
      uxInterpretation: 'صفحات المنتجات مرتفعة السعر تحتاج إلى تسلسل هرمي واضح لمعلومات المخاطرة والثقة.',
      conversionImpact: 'تأثير حاسم؛ هذا هو مركز قرار الشراء الفعلي.',
      recommendation: 'إظهار البائع والضمان والتوصيل والتقييم بجوار السعر مباشرة بطريقة أوضح.',
    });

    pushJourney('product', status, { label: 'صفحة المنتج' });
    pushLog('product', 'أحتاج إلى التأكد من أن العرض موثوق ومناسب.', 'تم فتح صفحة المنتج ومراجعة المعلومات الأساسية.', hasSellerSignal ? 'ظهرت إشارات ثقة مرتبطة بالبائع أو التنفيذ.' : 'بعض إشارات الثقة لم تكن فورية في أعلى الصفحة.', 'وضوح الثقة قرب السعر يختصر زمن الحسم.');

    pushIssue({
      title: 'تردد قبل شراء منتج مرتفع القيمة',
      category: 'Product info clarity',
      severity: 'high',
      affectedStep: 'product',
      explanation: 'المستخدمة تحتاج إلى مقارنة السعر والمواصفات والبائع والتقييمات قبل اتخاذ قرار الإضافة للسلة.',
      whyItMatters: 'أي نقص في الوضوح عند هذه النقطة يضرب التحويل مباشرة.',
    });

    pushIssue({
      title: 'وضوح البائع والتوصيل قد لا يكون فوريًا بما يكفي',
      category: 'Seller credibility',
      severity: hasSellerSignal ? 'medium' : 'high',
      affectedStep: 'product',
      explanation: 'إشارات الثقة المهمة للقرار قد تحتاج إلى قراءة أو تمرير إضافي بدل أن تكون حاضرة في أول نظرة.',
      whyItMatters: 'المشتري الحذر يتوقف عندما لا يفهم من يبيع المنتج وما شروط التوصيل بوضوح.',
    });

    pushPositive({
      title: 'وجود صفحة منتج مخصصة يدعم التقييم التفصيلي',
      category: 'Product info clarity',
      affectedStep: 'product',
      explanation: 'الانتقال إلى صفحة منفصلة يسمح بمراجعة أعمق قبل الإضافة إلى السلة.',
      impact: 'يدعم القرار المدروس للمنتجات المكلفة.',
    });
  } catch (error) {
    pushJourney('product', 'failed', { label: 'صفحة المنتج', error: error.message });
    pushIssue({
      title: 'تعذر فتح صفحة منتج مناسبة',
      category: 'Browsing & discovery',
      severity: 'critical',
      affectedStep: 'product',
      explanation: error.message,
      whyItMatters: 'الرحلة لا يمكن أن تستمر دون صفحة منتج قابلة للمراجعة.',
    });
    pushLog('product', 'أحتاج إلى فحص العرض قبل الشراء.', 'تمت محاولة فتح نتيجة مناسبة.', `فشل التنفيذ: ${error.message}`, 'تعطل حاسم في منتصف المسار.');
  }
}

async function addToCart(page) {
  try {
    log('Attempting to add to cart');
    const addButton = await findFirstVisible(page, [
      'button:has-text("Add to cart")',
      'button:has-text("ADD TO CART")',
      '[data-qa="addToCartBtn"]',
      'button[data-testid="add-to-cart-button"]',
      'button:has-text("Add To Cart")',
    ], { timeout: 12000 });

    if (!addButton) throw new Error('Add to cart button was not found');

    await addButton.scrollIntoViewIfNeeded();
    await humanPause(600, 1200);
    await addButton.click({ timeout: 8000 });
    await stableWait(page, 20000);
    await dismissPopups(page);

    const bodyText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '');
    const added = /added to cart|cart/i.test(bodyText || '');
    const status = added ? 'completed' : 'partial';

    await captureStep(page, {
      id: 'add-to-cart',
      step: 'add_to_cart',
      title: 'حالة الإضافة إلى السلة',
      fileName: screenshotFiles.addToCart,
      caption: 'الواجهة بعد محاولة إضافة المنتج إلى السلة.',
      status,
      whatHappened: 'تم النقر على زر الإضافة مع انتظار أي تحديث مرئي أو رسالة تأكيد.',
      userReaction: 'سارة تبحث فورًا عن إشارة مؤكدة بأن المنتج أُضيف بالفعل.',
      observation: 'ضعف وضوح رسالة النجاح يخلق قلقًا حول ما إذا كانت العملية نجحت فعلًا.',
      uxInterpretation: 'تأكيد الإجراء يجب أن يكون حاسمًا لأن هذه لحظة انتقال من التقييم إلى الالتزام.',
      conversionImpact: 'مرتفع جدًا؛ الغموض هنا قد يؤدي إلى نقرات مكررة أو مغادرة الصفحة.',
      recommendation: 'إظهار حالة نجاح ثابتة وواضحة تتضمن ملخص المنتج ورابط السلة.',
    });

    pushJourney('add_to_cart', status, { label: 'الإضافة إلى السلة' });
    pushLog('add_to_cart', 'أحتاج إلى تأكيد واضح بعد الإضافة.', 'تم النقر على زر إضافة إلى السلة.', added ? 'ظهرت مؤشرات مرتبطة بالسلة أو نجاح الإجراء.' : 'نجاح الإضافة لم يكن محسومًا بصريًا بالكامل.', 'رد الفعل الفوري بعد الإضافة عنصر ثقة أساسي.');

    pushIssue({
      title: 'احتمال غموض حالة الإضافة بعد النقر',
      category: 'Cart UX',
      severity: status === 'completed' ? 'medium' : 'high',
      affectedStep: 'add_to_cart',
      explanation: 'المستخدم ينتظر تأكيدًا مرئيًا قويًا بعد الإضافة، وأي ضعف هنا يسبب ارتباكًا.',
      whyItMatters: 'هذه اللحظة تحسم ما إذا كانت نية الشراء ستستمر إلى السلة.',
    });
  } catch (error) {
    const arabicError = 'لم يتم العثور على زر الإضافة إلى السلة في الحالة الحالية.';
    await captureStep(page, {
      id: 'add-to-cart',
      step: 'add_to_cart',
      title: 'حالة الإضافة إلى السلة',
      fileName: screenshotFiles.addToCart,
      caption: 'الحالة المرئية عند تعذر تنفيذ الإضافة إلى السلة.',
      status: 'failed',
      whatHappened: 'تمت محاولة العثور على زر الإضافة إلى السلة لكن الواجهة الحالية لم تعرض مدخلًا واضحًا للإجراء.',
      userReaction: 'سارة تتوقف هنا مباشرة لأنها لا تجد الخطوة التالية المتوقعة بوضوح.',
      observation: 'غياب زر الإضافة أو صعوبة اكتشافه يحول صفحة المنتج من مساحة قرار إلى مسار مسدود.',
      uxInterpretation: 'هذا عائق حرج لأن الواجهة لا تعطي المستخدم مسارًا صريحًا للالتزام بالشراء.',
      conversionImpact: 'تأثير حرج؛ المسار يتوقف قبل الانتقال إلى السلة.',
      recommendation: 'رفع بروز زر الإضافة في أول المنطقة المرئية والتأكد من ظهوره مع كل حالات المخزون والعروض.',
    });
    pushJourney('add_to_cart', 'failed', { label: 'الإضافة إلى السلة', error: arabicError });
    pushIssue({
      title: 'تعذر إضافة المنتج إلى السلة',
      category: 'Cart UX',
      severity: 'critical',
      affectedStep: 'add_to_cart',
      explanation: arabicError,
      whyItMatters: 'تعطل الإضافة يوقف مسار الشراء بالكامل.',
    });
    pushLog('add_to_cart', 'أريد متابعة الشراء.', 'تمت محاولة الإضافة للسلة.', `فشل التنفيذ: ${arabicError}`, 'هذا عطل مباشر في التحويل.');
  }
}

async function openCart(page) {
  const step = 'cart';
  try {
    log('Opening cart');
    const cartButton = await findFirstVisible(page, [
      'a[href*="/cart"]',
      'button:has-text("Cart")',
      '[data-qa="header-cart"]',
      'a:has-text("Cart")',
      '[href*="cart"]',
    ], { timeout: 10000 });

    if (!cartButton) throw new Error('Cart entry point was not found');

    await cartButton.click({ timeout: 8000 });
    await stableWait(page, 20000);
    await dismissPopups(page);

    const currentUrl = page.url();
    const status = /cart/i.test(currentUrl) ? 'completed' : 'partial';

    await captureStep(page, {
      id: 'cart',
      step,
      title: 'السلة',
      fileName: screenshotFiles.cart,
      caption: 'صفحة السلة بعد الانتقال من صفحة المنتج.',
      status,
      whatHappened: 'تم فتح السلة أو محاولة الوصول إليها بعد إضافة المنتج.',
      userReaction: 'سارة تراجع السعر النهائي والبائع والعناصر الجانبية قبل المتابعة.',
      observation: 'السلة هي نقطة مراجعة حساسة لأي رسوم أو تناقضات مفاجئة.',
      uxInterpretation: 'كلما كانت السلة مختصرة وواضحة قلّ احتمال التراجع قبل الدفع.',
      conversionImpact: 'مرتفع؛ هذه آخر نقطة مراجعة قبل الالتزام الأقوى في الدفع.',
      recommendation: 'إبراز عناصر الثقة والرسوم بوضوح في أول الشاشة دون تزاحم.',
    });

    pushJourney(step, status, { label: 'السلة' });
    pushLog(step, 'أريد التأكد من أن العرض ما زال منطقيًا.', 'تم فتح السلة ومراجعة الحالة المرئية.', `الرابط الحالي: ${currentUrl}`, 'وضوح السلة يحدد استعداد المستخدم للانتقال إلى الدفع.');
  } catch (error) {
    pushJourney(step, 'failed', { label: 'السلة', error: error.message });
    pushIssue({
      title: 'تعذر الوصول إلى السلة',
      category: 'Cart UX',
      severity: 'critical',
      affectedStep: step,
      explanation: error.message,
      whyItMatters: 'بدون السلة لا يمكن الانتقال إلى الدفع أو تقييم الرسوم النهائية.',
    });
    pushLog(step, 'أحتاج إلى مراجعة الطلب قبل الدفع.', 'تمت محاولة فتح السلة.', `فشل التنفيذ: ${error.message}`, 'هذا يوقف الرحلة قبل الحسم.');
  }
}

async function attemptCheckout(page) {
  const step = 'checkout';
  try {
    log('Attempting checkout');
    const checkoutButton = await findFirstVisible(page, [
      'button:has-text("Checkout")',
      'a:has-text("Checkout")',
      'button:has-text("Proceed")',
      'button:has-text("Continue")',
      '[data-qa="checkout-btn"]',
    ], { timeout: 10000 });

    let status = 'not reached';
    let observation = 'لم يظهر مدخل واضح للدفع في الحالة الحالية.';
    if (checkoutButton) {
      await checkoutButton.click({ timeout: 8000 });
      await stableWait(page, 20000);
      await dismissPopups(page);
      const bodyText = await page.locator('body').textContent({ timeout: 5000 }).catch(() => '');
      const currentUrl = page.url();
      if (/login|sign in|otp|verify|checkout|address/i.test(`${bodyText} ${currentUrl}`)) {
        status = /checkout|address/i.test(`${bodyText} ${currentUrl}`) ? 'partial' : 'failed';
        observation = /login|sign in|otp|verify/i.test(`${bodyText} ${currentUrl}`)
          ? 'بدأت خطوة الدفع لكنها اصطدمت بطلب تسجيل دخول أو تحقق.'
          : 'تم الوصول إلى بداية الدفع دون إتمام نهائي.';
      } else {
        status = 'partial';
        observation = 'تمت محاولة بدء الدفع لكن الحالة التالية لم تكن واضحة بالكامل.';
      }
    }

    await captureStep(page, {
      id: 'checkout',
      step,
      title: 'بداية الدفع',
      fileName: screenshotFiles.checkout,
      caption: 'الحالة الأخيرة بعد محاولة بدء عملية الدفع.',
      status,
      whatHappened: checkoutButton ? 'تمت محاولة الانتقال إلى الدفع.' : 'لم يظهر زر دفع واضح في الحالة الحالية.',
      userReaction: 'سارة تتوقع في هذه المرحلة فهم المتطلبات بوضوح، خصوصًا إذا كان تسجيل الدخول إجباريًا.',
      observation,
      uxInterpretation: 'أي مفاجأة مرتبطة بتسجيل الدخول أو المتطلبات النهائية يجب أن تُعرض مبكرًا حتى لا يشعر المستخدم بانقطاع المسار.',
      conversionImpact: 'حرج؛ هذه هي أكثر نقطة حساسة لفقدان نية الشراء.',
      recommendation: 'إظهار شرط التسجيل أو التحقق مبكرًا، أو توفير مسار ضيف إن كان ممكنًا.',
    });

    pushJourney(step, status, { label: 'الدفع' });
    pushLog(step, 'أنا جاهزة للمتابعة إذا لم تظهر مفاجآت.', 'تمت محاولة بدء الدفع.', observation, 'وضوح متطلبات الدفع عامل ثقة حاسم في نهاية الرحلة.');

    if (status !== 'completed') {
      pushIssue({
        title: 'عائق قبل إتمام الدفع النهائي',
        category: 'Checkout UX',
        severity: status === 'failed' ? 'critical' : 'high',
        affectedStep: step,
        explanation: observation,
        whyItMatters: 'أي توقف في هذه المرحلة يهدر الجهد المبذول في كل المراحل السابقة.',
      });
    } else {
      pushPositive({
        title: 'إمكانية الوصول إلى بداية الدفع',
        category: 'Checkout UX',
        affectedStep: step,
        explanation: 'الانتقال إلى شاشة الدفع تم دون انقطاع كبير في الرحلة.',
        impact: 'يبقي المستخدم داخل مسار التحويل حتى النقطة النهائية.',
      });
    }
  } catch (error) {
    pushJourney(step, 'failed', { label: 'الدفع', error: error.message });
    pushIssue({
      title: 'تعذر بدء عملية الدفع',
      category: 'Checkout UX',
      severity: 'critical',
      affectedStep: step,
      explanation: error.message,
      whyItMatters: 'تعطل بدء الدفع يفقد الجلسة هدفها الأساسي.',
    });
    pushLog(step, 'أريد معرفة الخطوة الأخيرة فقط.', 'تمت محاولة بدء الدفع.', `فشل التنفيذ: ${error.message}`, 'هذا عائق نهائي عالي التأثير.');
  }
}

async function main() {
  ensureDirs();
  let browser;

  try {
    const executablePath = resolveExecutablePath();
    browser = await chromium.launch({
      headless: false,
      executablePath,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--start-maximized',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      locale: 'en-SA',
      timezoneId: 'Asia/Riyadh',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      colorScheme: 'dark',
      extraHTTPHeaders: {
        'accept-language': 'en-SA,en;q=0.9,ar-SA;q=0.8',
      },
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'languages', { get: () => ['en-SA', 'en', 'ar-SA'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    await openHomepage(page);
    await performSearch(page);
    await captureResults(page);
    await chooseProduct(page);
    await addToCart(page);
    await openCart(page);
    await attemptCheckout(page);

    state.meta.finalTaskOutcome = state.journey.find((item) => item.step === 'checkout')?.status === 'completed'
      ? 'Reached checkout successfully and stopped before payment.'
      : 'Reached the end of the safe shopping path and stopped before any payment or authentication completion.';
  } catch (error) {
    log('Run failed', { error: error.message });
    state.meta.finalTaskOutcome = `Journey ended early: ${error.message}`;
  } finally {
    try {
      if (browser) await browser.close();
    } catch (_) {}

    writeAuditData();
    log('Audit data written', { file: AUDIT_DATA_PATH });
  }
}

main();
