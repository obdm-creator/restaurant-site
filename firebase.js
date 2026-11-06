import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

export const configured = !String(firebaseConfig.apiKey).startsWith('PASTE');

let db, ref;
if (configured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  ref = doc(db, 'restaurant', 'menu');
}

// مراقبة القائمة لحظياً
export function watchMenu(cb, onError) {
  if (!configured) { cb(structuredClone(DEFAULT_DATA)); return; }
  onSnapshot(ref, snap => cb(snap.exists() ? snap.data() : structuredClone(DEFAULT_DATA)), onError);
}

// حفظ البيانات في Firestore
export async function saveMenu(data) {
  if (!configured) throw new Error('not-configured');
  await setDoc(ref, data);
}

// الدخول برمز فقط — يتحقق من الرمز المحفوظ في Firestore أو الرمز الافتراضي
export async function adminLogin(code) {
  if (!code) return { ok: false, error: 'أدخل الرمز' };
  try {
    if (configured) {
      const snap = await getDoc(ref);
      const savedCode = snap.exists() ? (snap.data()?.settings?.adminCode || '4400') : '4400';
      if (code === savedCode) {
        sessionStorage.setItem('rs_admin', 'auth');
        return { ok: true };
      }
      return { ok: false, error: 'الرمز غير صحيح' };
    }
    // fallback: بدون Firebase
    if (code === '4400') { sessionStorage.setItem('rs_admin', 'auth'); return { ok: true }; }
    return { ok: false, error: 'الرمز غير صحيح' };
  } catch (e) {
    return { ok: false, error: 'تعذر التحقق، تحقق من الاتصال' };
  }
}

export function adminMode() {
  return Promise.resolve(sessionStorage.getItem('rs_admin') || null);
}

export async function adminLogout() {
  sessionStorage.removeItem('rs_admin');
}
