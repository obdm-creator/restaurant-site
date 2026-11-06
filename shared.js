// رابط تطبيق وطن في المتجر (يظهر في أسفل الموقع)
const WATAN_STORE_URL = 'https://play.google.com/store/apps/details?id=com.orhan.watan&hl=ar';

// بيانات الموقع المشتركة بين الواجهة ولوحة التحكم
// قائمة أمثلة جاهزة: تظهر تلقائياً قبل أن تضيف قائمتك، ويمكن تحميلها من لوحة التحكم > الإعدادات
const DEFAULT_DATA = {
  settings: {
    name: 'Extra Sauce',
    whatsapp: '9647749797666',
    currency: 'د.ع',
    adminCode: '1234'
  },
  categories: [
    { id: 'c1', name: 'برجر', emoji: '🍔' },
    { id: 'c2', name: 'دجاج', emoji: '🍗' },
    { id: 'c3', name: 'ساندويشات', emoji: '🌯' },
    { id: 'c4', name: 'بيتزا', emoji: '🍕' },
    { id: 'c5', name: 'جانبية', emoji: '🍟' },
    { id: 'c6', name: 'مشروبات', emoji: '🥤' }
  ],
  items: [
    { id: 'i1', catId: 'c1', emoji: '🍔', name: 'برجر كلاسيك', desc: 'لحم بقري، جبن شيدر، خس، طماطم، صوص خاص', price: 5000, img: '', available: true, hot: true },
    { id: 'i2', catId: 'c1', emoji: '🍔', name: 'دبل برجر', desc: 'قطعتان لحم، جبن مضاعف، مخلل', price: 7500, img: '', available: true },
    { id: 'i3', catId: 'c1', emoji: '🍔', name: 'برجر دجاج مقرمش', desc: 'صدر دجاج مقرمش مع مايونيز وخس', price: 5500, img: '', available: true },
    { id: 'i4', catId: 'c2', emoji: '🍗', name: 'بروستد 4 قطع', desc: 'دجاج مقرمش مع ثوم وبطاطا', price: 9000, img: '', available: true, hot: true },
    { id: 'i5', catId: 'c2', emoji: '🍗', name: 'أجنحة حارة', desc: '8 قطع بصوص الباربكيو الحار', price: 6500, img: '', available: true },
    { id: 'i6', catId: 'c2', emoji: '🍗', name: 'ستربس دجاج', desc: '5 قطع مع صوص الجبن', price: 6000, img: '', available: true },
    { id: 'i7', catId: 'c3', emoji: '🌯', name: 'شاورما دجاج', desc: 'خبز صاج، ثوم، مخلل، بطاطا', price: 3500, img: '', available: true },
    { id: 'i8', catId: 'c3', emoji: '🌯', name: 'تويستر', desc: 'دجاج مقرمش ملفوف بخبز التورتيلا', price: 4500, img: '', available: true },
    { id: 'i9', catId: 'c4', emoji: '🍕', name: 'بيتزا مارغريتا', desc: 'جبن موتزاريلا وصلصة طماطم', price: 8000, img: '', available: true },
    { id: 'i10', catId: 'c4', emoji: '🍕', name: 'بيتزا بيبروني', desc: 'بيبروني وجبن موتزاريلا', price: 10000, img: '', available: true, hot: true },
    { id: 'i11', catId: 'c5', emoji: '🍟', name: 'بطاطا مقلية', desc: 'حجم وسط مع كاتشب', price: 2000, img: '', available: true },
    { id: 'i12', catId: 'c5', emoji: '🧅', name: 'حلقات البصل', desc: '8 حلقات مقرمشة', price: 2500, img: '', available: true },
    { id: 'i13', catId: 'c5', emoji: '🧀', name: 'أصابع الجبن', desc: '6 قطع مع صوص الطماطم', price: 3000, img: '', available: true },
    { id: 'i14', catId: 'c6', emoji: '🥤', name: 'كولا', desc: 'علبة 330 مل', price: 1000, img: '', available: true },
    { id: 'i15', catId: 'c6', emoji: '🧃', name: 'عصير برتقال طازج', desc: 'كوب 400 مل', price: 2000, img: '', available: true }
  ]
};

function uid(p) {
  return p + Math.random().toString(36).slice(2, 9);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmt(n, cur) {
  return Number(n).toLocaleString('en-US') + ' ' + cur;
}

// يحوّل الرقم المحلي العراقي (07xxxxxxxxx) إلى الصيغة الدولية المطلوبة لواتساب
function waNumber(n) {
  let d = String(n).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '964' + d.slice(1);
  return d;
}
