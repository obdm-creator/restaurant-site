import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

export const configured = !String(firebaseConfig.apiKey).startsWith('PASTE');

let db, auth, ref;
if (configured) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  ref = doc(db, 'restaurant', 'menu'); // مستند واحد: settings + categories + items
}

// مراقبة القائمة لحظياً. إن لم يُضبط فايربيس أو لا توجد بيانات تُستخدم البيانات الافتراضية.
export function watchMenu(cb, onError) {
  if (!configured) { cb(structuredClone(DEFAULT_DATA)); return; }
  onSnapshot(ref, snap => cb(snap.exists() ? snap.data() : structuredClone(DEFAULT_DATA)), onError);
}

export async function saveMenu(data) {
  if (!configured) throw new Error('not-configured');
  await setDoc(ref, data);
}

export function login(email, pass) {
  return signInWithEmailAndPassword(auth, email, pass);
}
export function logout() { return signOut(auth); }
export function watchAuth(cb) {
  if (!configured) { cb(null); return; }
  onAuthStateChanged(auth, u => cb(u && u.email ? u : null)); // تجاهل المستخدمين المجهولين
}

// الدخول بالرمز: يتحقق فايربيس من الرمز (حساب owner@restaurant.app وكلمة مروره Rs#<الرمز>).
// إذا لم يُفعَّل Email/Password في فايربيس بعد، يعمل الرمز التجريبي محلياً بدون صلاحية حفظ.
export const ADMIN_EMAIL = 'owner@restaurant.app';
const TRIAL_CODE = '4400';

export async function adminLogin(code) {
  if (configured) {
    try {
      await login(ADMIN_EMAIL, 'Rs#' + code);
      sessionStorage.setItem('rs_admin', 'auth');
      return { ok: true };
    } catch (e) {
      const notReady = ['auth/operation-not-allowed', 'auth/configuration-not-found', 'auth/network-request-failed'];
      if (!notReady.includes(e.code)) return { ok: false, error: 'الرمز غير صحيح' };
    }
  }
  if (code === TRIAL_CODE) { sessionStorage.setItem('rs_admin', 'trial'); return { ok: true }; }
  return { ok: false, error: 'الرمز غير صحيح' };
}

// 'auth' = دخول فعلي يسمح بالحفظ، 'trial' = تجريبي، null = غير مسموح
export function adminMode() {
  return new Promise(resolve => {
    const m = sessionStorage.getItem('rs_admin');
    if (!m) return resolve(null);
    if (!configured || m === 'trial') return resolve('trial');
    const stop = onAuthStateChanged(auth, u => { stop(); resolve(u && u.email ? 'auth' : null); });
  });
}

export async function adminLogout() {
  sessionStorage.removeItem('rs_admin');
  if (configured) await signOut(auth).catch(() => {});
}
