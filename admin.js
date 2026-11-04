import { watchMenu, saveMenu, adminMode, adminLogout } from './firebase.js';

let data = structuredClone(DEFAULT_DATA);
let loaded = false;
let editingId = null;
let imgData = null;      // null = بدون تغيير، '' = إزالة الصورة، نص = صورة جديدة
let filterCat = 'all';
let query = '';
const $ = id => document.getElementById(id);

// الدخول للوحة: ضغطتان على زر السلة في الموقع ثم الرمز
let mode = null;
adminMode().then(m => {
  if (!m) { location.replace('index.html'); return; }
  mode = m;
  $('app').hidden = false;
  $('fab').hidden = false;
  $('topActions').hidden = false;
  $('trialBar').hidden = m !== 'trial';
  watchMenu(d => { if (!loaded) { data = d; loaded = true; renderAll(); } });
  renderAll();
});
$('logoutBtn').onclick = async () => { await adminLogout(); location.replace('index.html'); };

// ---------- أدوات ----------
let toastTimer;
function toast(msg, bad) {
  const t = $('toast');
  t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = 'toast', 2200);
}

async function persist(okMsg = 'تم الحفظ ✓') {
  renderAll();
  if (mode === 'trial') { toast('وضع تجريبي: التعديل يظهر هنا فقط ولا يُحفظ', true); return; }
  try { await saveMenu(data); toast(okMsg); }
  catch (e) { toast('فشل الحفظ: ' + (e.code || e.message), true); throw e; }
}

const openModal = id => { $(id).hidden = false; };
const closeModals = () => document.querySelectorAll('.modal').forEach(m => m.hidden = true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
document.querySelectorAll('.modal').forEach(m => m.addEventListener('mousedown', e => { if (e.target === m) closeModals(); }));
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModals);

// ---------- الرسم ----------
function renderAll() {
  renderStats(); renderFilter(); renderItems(); renderCatSelect(); renderCatRows();
  const s = data.settings;
  $('sName').value = s.name; $('sWa').value = s.whatsapp; $('sCur').value = s.currency;
}

function renderStats() {
  $('stItems').textContent = data.items.length;
  $('stCats').textContent = data.categories.length;
  $('stOff').textContent = data.items.filter(i => !i.available).length;
}

function renderFilter() {
  if (filterCat !== 'all' && !data.categories.some(c => c.id === filterCat)) filterCat = 'all';
  const all = [{ id: 'all', name: 'الكل' }, ...data.categories];
  $('aCats').innerHTML = all.map(c =>
    `<button class="chip ${c.id === filterCat ? 'active' : ''}" data-filter="${esc(c.id)}">${esc(c.name)}</button>`).join('');
}

function renderItems() {
  const q = query.trim().toLowerCase();
  const order = id => data.categories.findIndex(c => c.id === id);
  const list = data.items
    .filter(i => (filterCat === 'all' || i.catId === filterCat) && (!q || i.name.toLowerCase().includes(q)))
    .sort((a, b) => order(a.catId) - order(b.catId));
  const catName = id => (data.categories.find(c => c.id === id) || {}).name || '—';
  $('itemList').innerHTML = list.map(i => `
    <article class="icard ${i.available ? '' : 'off'}">
      <div class="thumb-lg" ${i.img ? `style="background-image:url('${esc(i.img)}')"` : ''}>${i.img ? '' : esc(i.emoji || '🍔')}</div>
      <div class="info">
        <strong>${esc(i.name)}</strong>
        <small>${esc(catName(i.catId))}</small>
        <span class="price">${fmt(i.price, data.settings.currency)}</span>
      </div>
      <div class="side">
        <button class="switch ${i.available ? 'on' : ''}" data-toggle="${esc(i.id)}" role="switch" aria-checked="${i.available}" aria-label="متوفر"></button>
        <div class="actions">
          <button class="mini" data-edit="${esc(i.id)}" aria-label="تعديل">✏️</button>
          <button class="mini" data-del="${esc(i.id)}" aria-label="حذف">🗑️</button>
        </div>
      </div>
    </article>`).join('') ||
    `<div class="empty">${data.items.length ? 'لا توجد نتائج' : 'لا توجد وجبات بعد. اضغط + لإضافة وجبة، أو <br><br><button class="btn small" data-sample>تحميل قائمة أمثلة جاهزة</button>'}</div>`;
}

function renderCatSelect() {
  const cur = $('iCat').value;
  $('iCat').innerHTML = data.categories.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
  if (cur && data.categories.some(c => c.id === cur)) $('iCat').value = cur;
  else if (filterCat !== 'all') $('iCat').value = filterCat;
}

function renderCatRows() {
  $('catRows').innerHTML = data.categories.map((c, idx) => `
    <div class="line">
      <div class="name">${esc(c.name)} <small style="color:#a8a8a8">(${data.items.filter(i => i.catId === c.id).length})</small></div>
      <div class="actions">
        <button class="mini" data-up="${idx}" aria-label="أعلى">▲</button>
        <button class="mini" data-down="${idx}" aria-label="أسفل">▼</button>
        <button class="mini" data-rencat="${esc(c.id)}" aria-label="تعديل الاسم">✏️</button>
        <button class="mini" data-delcat="${esc(c.id)}" aria-label="حذف">🗑️</button>
      </div>
    </div>`).join('') || '<div class="empty">لا توجد أقسام</div>';
}

// ---------- الأقسام ----------
$('openCats').onclick = () => openModal('mCats');
$('cAdd').onclick = addCat;
$('cName').addEventListener('keydown', e => { if (e.key === 'Enter') addCat(); });
function addCat() {
  const name = $('cName').value.trim();
  if (!name) return;
  data.categories.push({ id: uid('c'), name });
  $('cName').value = '';
  persist().catch(() => {});
}

// ---------- الوجبات ----------
$('fab').onclick = () => openItemForm(null);
$('aSearch').addEventListener('input', e => { query = e.target.value; renderItems(); });

function setPreview(src) {
  $('iPrev').style.backgroundImage = src ? `url('${src}')` : '';
  $('dropText').hidden = !!src;
  $('iRemoveImg').hidden = !src;
}

function openItemForm(item) {
  editingId = item ? item.id : null;
  imgData = null;
  $('itemFormTitle').textContent = item ? 'تعديل وجبة' : 'إضافة وجبة';
  $('iName').value = item ? item.name : '';
  $('iPrice').value = item ? item.price : '';
  $('iDesc').value = item ? item.desc : '';
  $('iAvail').checked = item ? item.available : true;
  $('iHot').checked = item ? !!item.hot : false;
  $('iEmoji').value = item ? (item.emoji || '') : '';
  $('iImg').value = '';
  $('iErr').textContent = '';
  $('iNewCat').value = '';
  renderCatSelect();
  if (item) $('iCat').value = item.catId;
  $('newCatBox').hidden = data.categories.length > 0;
  $('iAddCat').hidden = data.categories.length === 0 ? true : false;
  setPreview(item ? item.img : '');
  openModal('mItem');
  setTimeout(() => $('iName').focus(), 50);
}

$('iAddCat').onclick = () => { $('newCatBox').hidden = false; $('iAddCat').hidden = true; $('iNewCat').focus(); };

// اختيار الصورة من المعرض (أو سحبها) مع ضغطها
const pickImage = () => $('iImg').click();
$('drop').onclick = pickImage;
$('drop').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickImage(); } });
$('iPick').onclick = pickImage;
$('iRemoveImg').onclick = () => { imgData = ''; $('iImg').value = ''; setPreview(''); };
['dragover', 'drop'].forEach(ev => $('drop').addEventListener(ev, e => {
  e.preventDefault();
  if (ev === 'drop' && e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]);
}));
$('iImg').onchange = e => { if (e.target.files[0]) readImage(e.target.files[0]); };

function readImage(f) {
  if (!f.type.startsWith('image/')) { $('iErr').textContent = 'اختر ملف صورة'; return; }
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 480, r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      imgData = c.toDataURL('image/jpeg', 0.7);
      setPreview(imgData);
      $('iErr').textContent = '';
    };
    img.onerror = () => { $('iErr').textContent = 'تعذر قراءة الصورة'; };
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
}

$('iSave').onclick = () => {
  const name = $('iName').value.trim();
  const price = parseFloat($('iPrice').value);
  const newCat = $('iNewCat').value.trim();
  const err = $('iErr');
  if (!name || isNaN(price) || price < 0) { err.textContent = 'اكتب الاسم وسعراً صحيحاً'; return; }
  if (!newCat && !data.categories.length) { err.textContent = 'اكتب اسم القسم'; return; }

  const backup = JSON.stringify(data);
  let catId = $('iCat').value;
  if (newCat && !$('newCatBox').hidden) {
    catId = uid('c');
    data.categories.push({ id: catId, name: newCat });
  }
  const base = { catId, name, desc: $('iDesc').value.trim(), price, available: $('iAvail').checked, hot: $('iHot').checked, emoji: $('iEmoji').value.trim() };
  if (editingId) {
    const it = data.items.find(i => i.id === editingId);
    Object.assign(it, base);
    if (imgData !== null) it.img = imgData;
  } else {
    data.items.push({ id: uid('i'), img: imgData || '', ...base });
  }
  if (JSON.stringify(data).length > 900000) {
    data = JSON.parse(backup);
    err.textContent = 'حجم البيانات كبير، احذف بعض الصور أو استخدم صوراً أصغر';
    return;
  }
  persist().then(closeModals).catch(() => {});
};

// ---------- أحداث عامة ----------
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.sample !== undefined) loadSample();
  if (d.filter) { filterCat = d.filter; renderFilter(); renderItems(); }
  if (d.toggle) { const it = data.items.find(i => i.id === d.toggle); it.available = !it.available; persist().catch(() => {}); }
  if (d.del && confirm('حذف هذه الوجبة؟')) { data.items = data.items.filter(i => i.id !== d.del); persist().catch(() => {}); }
  if (d.edit) openItemForm(data.items.find(i => i.id === d.edit));
  if (d.delcat) {
    const n = data.items.filter(i => i.catId === d.delcat).length;
    if (confirm(n ? `سيتم حذف القسم و${n} وجبة. متابعة؟` : 'حذف هذا القسم؟')) {
      data.categories = data.categories.filter(c => c.id !== d.delcat);
      data.items = data.items.filter(i => i.catId !== d.delcat);
      persist().catch(() => {});
    }
  }
  if (d.rencat) {
    const c = data.categories.find(c => c.id === d.rencat);
    const name = prompt('اسم القسم الجديد', c.name);
    if (name && name.trim()) { c.name = name.trim(); persist().catch(() => {}); }
  }
  if (d.up !== undefined || d.down !== undefined) {
    const i = Number(d.up ?? d.down), j = d.up !== undefined ? i - 1 : i + 1;
    if (j >= 0 && j < data.categories.length) {
      [data.categories[i], data.categories[j]] = [data.categories[j], data.categories[i]];
      persist().catch(() => {});
    }
  }
});

// ---------- الإعدادات ----------
$('openSettings').onclick = () => openModal('mSettings');
$('sSave').onclick = () => {
  const wa = waNumber($('sWa').value);
  if (!$('sName').value.trim() || wa.length < 8) { $('sErr').textContent = 'تحقق من الاسم ورقم الواتساب'; return; }
  $('sErr').textContent = '';
  Object.assign(data.settings, { name: $('sName').value.trim(), whatsapp: wa, currency: $('sCur').value.trim() || 'د.ع' });
  persist().then(closeModals).catch(() => {});
};

$('exp').onclick = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'menu-backup.json'; a.click();
  URL.revokeObjectURL(a.href);
};

$('imp').onchange = async e => {
  try {
    const j = JSON.parse(await e.target.files[0].text());
    if (!j.settings || !Array.isArray(j.categories) || !Array.isArray(j.items)) throw 0;
    data = j; persist('تم الاستيراد ✓').then(closeModals).catch(() => {});
  } catch { toast('ملف غير صالح', true); }
};

// تحميل قائمة أمثلة جاهزة (يبقى اسم المطعم ورقم الواتساب)
function loadSample() {
  if (!confirm('سيتم استبدال الأقسام والوجبات الحالية بأمثلة جاهزة، ويبقى اسم المطعم ورقم الواتساب. متابعة؟')) return;
  const settings = data.settings;
  data = structuredClone(DEFAULT_DATA);
  data.settings = settings;
  persist('تم تحميل الأمثلة ✓').then(closeModals).catch(() => {});
}
