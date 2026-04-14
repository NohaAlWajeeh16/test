# Noon Saudi AI Usability Analysis

هذا المشروع ينفذ رحلة تسوق حية على موقع نون السعودية باستخدام Playwright، ثم يحولها إلى تحليل قابلية استخدام منظم ولوحة عربية تفاعلية.

## المتطلبات

- Node.js 18 أو أحدث
- npm
- Playwright Chromium

## التثبيت

```bash
npm install
npx playwright install chromium
```

## تشغيل سكربت الالتقاط

```bash
node scripts/capture-noon.js
```

ما الذي يفعله السكربت:

- يفتح `https://www.noon.com/saudi-en/`
- يبحث عن `iPhone 17 Pro Max`
- يلتقط لقطات شاشة حقيقية لكل مرحلة رئيسية
- يسجل الرحلة في `data/audit-data.js`
- يتوقف قبل أي دفع فعلي

## مكان حفظ الصور

يتم حفظ الصور داخل مجلد `images/` بالأسماء التالية:

- `images/noon-home.png`
- `images/noon-search.png`
- `images/noon-results.png`
- `images/noon-product.png`
- `images/noon-add-to-cart.png`
- `images/noon-cart.png`
- `images/noon-checkout.png`

## فتح لوحة التحليل

بعد تشغيل السكربت:

1. افتح الملف `index.html` مباشرة في المتصفح
2. ستحمّل الصفحة البيانات من `data/audit-data.js`
3. ستظهر كل الأقسام ديناميكيًا اعتمادًا على نتائج الجلسة الأخيرة

## تحديث المحددات إذا تغيّر موقع نون

قد يغيّر Noon البنية أو أسماء العناصر في أي وقت. لتحديث السكربت:

- راجع المحددات داخل `scripts/capture-noon.js`
- ابدأ بالدوال:
- `dismissPopups()`
- `findFirstVisible()`
- `performSearch()`
- `chooseProduct()`
- `addToCart()`
- `openCart()`
- `attemptCheckout()`
- أضف محددات بديلة قبل حذف القديمة
- حافظ على منطق `try/catch` لكل خطوة حتى لا تنهار الرحلة كاملة عند تغير عنصر واحد

## حدود معروفة

- قد يتطلب بدء الدفع تسجيل دخول أو تحقق برقم الهاتف أو عنوان شحن
- السكربت يتوقف قبل أي دفع حقيقي عمدًا
- إذا ظهر حاجز تسجيل دخول أو تحقق، فسيتم اعتباره عائقًا UX وسيتم توثيقه داخل البيانات واللوحة
- الموقع قد يعرض نوافذ منبثقة أو تغييرات حسب الموقع الجغرافي أو حالة الجلسة

## هيكل المشروع

```text
project-root/
  index.html
  images/
  scripts/
    capture-noon.js
  data/
    audit-data.js
  README.md
```
