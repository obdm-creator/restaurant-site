import { watchMenu, adminLogin } from './firebase.js';

let data;
let activeCat = 'all';
let query = '';
let cart = JSON.parse(localStorage.getItem('rs_cart') || '{}'); // { itemId: qty }
let locationUrl = '';

const $ = id => document.getElementById(id);

// ضغطة واحدة على السلة تفتحها، ضغطتان سريعتان تفتحان نافذة رمز لوحة التحكم
const cartBtn = $('cartBtn');
let tapTimer = null;
cartBtn.addEventListener('click', () => {
  if (tapTimer) {               // الضغطة الثانية
    clearTimeout(tapTimer); tapTimer = null;
    openGate();
    return;
  }
  tapTimer = setTimeout(() => { tapTimer = null; toggleCart(true); }, 300);
});

function openGate() {
  $('gateErr').textContent = '';
  $('gateCode').value = '';
  $('gate').hidden = false;
  setTimeout(() => $('gateCode').focus(), 50);
}
const closeGate = () => { $('gate').hidden = true; };

async function submitGate() {
  const code = $('gateCode').value.trim();
  if (!code) return;
  $('gateOk').disabled = true;
  $('gateErr').textContent = '';
  const res = await adminLogin(code);
  $('gateOk').disabled = false;
  if (res.ok) { location.href = 'admin.html'; return; }
  $('gateErr').textContent = res.error;
  $('gateCode').value = '';
  $('gateCode').focus();
}
$('gateOk').onclick = submitGate;
$('gateCode').addEventListener('keydown', e => { if (e.key === 'Enter') submitGate(); });
$('gateCancel').onclick = closeGate;
$('gate').addEventListener('mousedown', e => { if (e.target === $('gate')) closeGate(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGate(); });

$('cName').value = localStorage.getItem('rs_name') || '';
$('cPhone').value = localStorage.getItem('rs_phone') || '';

// تحديث لحظي: أي تعديل من لوحة التحكم يظهر مباشرة
watchMenu(d => {
  data = d;
  const s = data.settings;
  if (!s.name || s.name === 'برجر هاوس') s.name = 'Extra Sauce'; // الاسم القديم المحفوظ
  document.title = s.name;
  if (activeCat !== 'all' && !data.categories.some(c => c.id === activeCat)) activeCat = 'all';
  renderCats();
  renderMenu();
  renderCart();
}, () => { $('menu').innerHTML = '<div class="empty">تعذر تحميل القائمة</div>'; });

function renderCats() {
  const all = [{ id: 'all', name: 'الكل' }, ...data.categories];
  $('cats').innerHTML = all.map(c =>
    `<button class="chip ${c.id === activeCat ? 'active' : ''}" data-id="${esc(c.id)}">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}</button>`).join('');
}

function itemCard(i) {
  const img = i.img ? `style="background-image:url('${esc(i.img)}')"` : '';
  return `<article class="card">
    <div class="img" ${img}>${i.img ? '' : esc(i.emoji || '🍔')}${i.hot ? '<span class="badge">🔥 الأكثر طلباً</span>' : ''}</div>
    <div class="body">
      <h3>${esc(i.name)}</h3>
      <p>${esc(i.desc)}</p>
      <div class="row">
        <span class="price">${fmt(i.price, data.settings.currency)}</span>
        <button class="add" data-add="${esc(i.id)}" ${i.available ? '' : 'disabled'}>${i.available ? 'أضف +' : 'غير متوفر'}</button>
      </div>
    </div>
  </article>`;
}

function renderMenu() {
  const q = query.trim().toLowerCase();
  const cats = data.categories.filter(c => activeCat === 'all' || c.id === activeCat);
  let html = '';
  for (const c of cats) {
    const items = data.items.filter(i => i.catId === c.id &&
      (!q || i.name.toLowerCase().includes(q) || (i.desc || '').toLowerCase().includes(q)));
    if (!items.length) continue;
    html += `<h2 class="cat-title">${c.emoji ? esc(c.emoji) + ' ' : ''}${esc(c.name)}</h2><div class="grid">${items.map(itemCard).join('')}</div>`;
  }
  $('menu').innerHTML = html || '<div class="empty">لا توجد نتائج</div>';
}

function saveCart() { localStorage.setItem('rs_cart', JSON.stringify(cart)); }

function cartEntries() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ item: data.items.find(i => i.id === id), qty }))
    .filter(e => e.item && e.item.available);
}

function renderCart() {
  const entries = cartEntries();
  const count = entries.reduce((a, e) => a + e.qty, 0);
  const total = entries.reduce((a, e) => a + e.qty * e.item.price, 0);
  $('cartCount').textContent = count;
  $('cartTotal').textContent = fmt(total, data.settings.currency);
  $('cartLines').innerHTML = entries.length ? entries.map(e => `
    <div class="line">
      <div class="name">${esc(e.item.name)}<br><small class="price">${fmt(e.item.price * e.qty, data.settings.currency)}</small></div>
      <div class="qty">
        <button data-dec="${esc(e.item.id)}" aria-label="إنقاص">−</button>
        <span>${e.qty}</span>
        <button data-inc="${esc(e.item.id)}" aria-label="زيادة">+</button>
      </div>
    </div>`).join('') : '<div class="empty">السلة فارغة</div>';
}

function change(id, d) {
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function toggleCart(open) {
  $('drawer').classList.toggle('open', open);
  $('overlay').classList.toggle('open', open);
}

document.addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.id) { activeCat = t.dataset.id; renderCats(); renderMenu(); }
  if (t.dataset.add) { change(t.dataset.add, 1); }
  if (t.dataset.inc) change(t.dataset.inc, 1);
  if (t.dataset.dec) change(t.dataset.dec, -1);
});
$('search').addEventListener('input', e => { query = e.target.value; renderMenu(); });
$('closeCart').onclick = $('overlay').onclick = () => toggleCart(false);

// تحديد الموقع
$('locBtn').onclick = () => {
  const st = $('locStatus');
  if (!navigator.geolocation) { st.textContent = 'المتصفح لا يدعم تحديد الموقع'; return; }
  st.className = 'loc-status';
  st.textContent = 'جاري تحديد الموقع...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      locationUrl = `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
      st.className = 'loc-status ok';
      st.textContent = '✔ تم تحديد موقعك';
    },
    () => { st.textContent = 'تعذر تحديد الموقع، اسمح بالوصول للموقع أو اكتب العنوان في الملاحظات'; },
    { enableHighAccuracy: true, timeout: 15000 }
  );
};

// إرسال الطلب
$('sendBtn').onclick = () => {
  const entries = cartEntries();
  const name = $('cName').value.trim();
  const phone = $('cPhone').value.trim();
  const note = $('cNote').value.trim();
  const err = $('err');
  if (!entries.length) { err.textContent = 'السلة فارغة'; return; }
  if (!name) { err.textContent = 'اكتب اسمك'; return; }
  if (!/^[0-9+\s-]{7,16}$/.test(phone)) { err.textContent = 'رقم الهاتف غير صحيح'; return; }
  if (!locationUrl && !note) { err.textContent = 'حدد موقعك أو اكتب عنوانك'; return; }
  err.textContent = '';

  localStorage.setItem('rs_name', name);
  localStorage.setItem('rs_phone', phone);

  const cur = data.settings.currency;
  const total = entries.reduce((a, e) => a + e.qty * e.item.price, 0);
  const lines = entries.map(e => `• ${e.item.name} × ${e.qty} = ${fmt(e.item.price * e.qty, cur)}`);
  const msg = [
    `*طلب جديد - ${data.settings.name}*`,
    '',
    ...lines,
    '',
    `*المجموع:* ${fmt(total, cur)}`,
    '',
    `*الاسم:* ${name}`,
    `*الهاتف:* ${phone}`,
    locationUrl ? `*الموقع:* ${locationUrl}` : '',
    note ? `*ملاحظات:* ${note}` : ''
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');

  const num = waNumber(data.settings.whatsapp);
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  cart = {}; saveCart(); renderCart();
};
