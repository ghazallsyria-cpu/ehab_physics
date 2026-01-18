
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// تهيئة التطبيق الأساسي
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// تهيئة تطبيق ثانوي لإدارة عمليات Auth الخاصة بالمسؤول
// هذا يمنع تسجيل خروج المسؤول عند إنشاء حسابات يدوية للطلاب/المعلمين
const secondaryAppName = "SecondaryAdminApp";
let secondaryApp;
if (!getApps().find(a => a.name === secondaryAppName)) {
  secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
} else {
  secondaryApp = getApp(secondaryAppName);
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = provider;
