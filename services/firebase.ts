
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import "firebase/storage"; // Assuming storage is used via Supabase mostly, but keeping for compatibility if needed

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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// تهيئة تطبيق ثانوي لإدارة عمليات Auth الخاصة بالمسؤول
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
    console.error("Secondary Firebase App Error:", e);
}

export const db = firebase.firestore();
export const auth = firebase.auth();
export const secondaryAuth = secondaryApp ? secondaryApp.auth() : null;

const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = provider;
