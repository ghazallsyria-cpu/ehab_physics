
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// تأكد من مطابقة هذه المفاتيح مع ملف .env ومع vite.config.ts
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || (import.meta as any).env?.VITE_FIREBASE_APP_ID
};

// تهيئة التطبيق الأساسي
let app;
try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// تهيئة تطبيق ثانوي لإدارة عمليات Auth الخاصة بالمسؤول
const secondaryAppName = "SecondaryAdminApp";
let secondaryApp;
try {
    if (!getApps().find(a => a.name === secondaryAppName)) {
        secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    } else {
        secondaryApp = getApp(secondaryAppName);
    }
} catch (e) {
    console.error("Secondary Firebase App Error:", e);
}

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : ({} as any);
export const secondaryAuth = secondaryApp ? getAuth(secondaryApp) : null;

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = provider;
