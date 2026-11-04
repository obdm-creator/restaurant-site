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

// الدخول بالرمز فقط: حساب المدير ثابت وكلمة مروره مشتقة من الرمز
export const ADMIN_EMAIL = 'owner@restaurant.app';
export function adminLogin(code) {
  return login(ADMIN_EMAIL, 'Rs#' + code);
}
