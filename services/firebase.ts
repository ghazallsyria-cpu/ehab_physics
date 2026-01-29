
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage";

// تكوين احتياطي ثابت لضمان العمل حتى لو فشل تحميل المتغيرات البيئية
const FALLBACK_CONFIG = {
  apiKey: "AIzaSyAwbn6xMl8RZ52cWk571CS_hI4Qo9Kh1VY",
  authDomain: "physi-kuwait-prod-46032.firebaseapp.com",
  projectId: "physi-kuwait-prod-46032",
  storageBucket: "physi-kuwait-prod-46032.firebasestorage.app",
  messagingSenderId: "27783754762",
  appId: "1:27783754762:web:fa0065227eed7e52081bf3"
};

const resolveConfig = (envKey: string, viteKey: string, fallback: string) => {
  // 1. محاولة استخدام process.env (يتم استبداله بواسطة Vite عند البناء)
  if (typeof process !== 'undefined' && process.env && process.env[envKey]) {
    return process.env[envKey];
  }
  
  // 2. محاولة استخدام import.meta.env (لبيئات التطوير الحديثة)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (e) {}

  // 3. استخدام القيمة الثابتة كحل أخير ومضمون
  return fallback;
};

const firebaseConfig = {
  apiKey: resolveConfig('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY', FALLBACK_CONFIG.apiKey),
  authDomain: resolveConfig('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN', FALLBACK_CONFIG.authDomain),
  projectId: resolveConfig('VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID', FALLBACK_CONFIG.projectId),
  storageBucket: resolveConfig('VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET', FALLBACK_CONFIG.storageBucket),
  messagingSenderId: resolveConfig('VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID', FALLBACK_CONFIG.messagingSenderId),
  appId: resolveConfig('VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID', FALLBACK_CONFIG.appId)
};

// تهيئة التطبيق الأساسي
if (!firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
}

// تهيئة تطبيق ثانوي لإدارة عمليات Auth الخاصة بالمسؤول (اختياري)
const secondaryAppName = "SecondaryAdminApp";
let secondaryApp;
try {
    const existingApp = firebase.apps.find(a => a.name === secondaryAppName);
    if (!existingApp) {
        secondaryApp = firebase.initializeApp(firebaseConfig, secondaryAppName);
    } else {
        secondaryApp = existingApp;
    }
} catch (e) {
    console.warn("Secondary Firebase App Warning (Non-critical):", e);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export const secondaryAuth = secondaryApp ? secondaryApp.auth() : null;

const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = provider;
