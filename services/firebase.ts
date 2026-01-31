import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage";

// Use Vite's standard `import.meta.env` for VITE_ prefixed variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// تهيئة التطبيق الأساسي مع التحقق من عدم التكرار
let app;
try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
} catch (error) {
    console.error("Firebase Initialization Error:", error);
}

// تصدير الخدمات
export const db = app ? firebase.firestore() : null;
export const auth = app ? firebase.auth() : null;
export const storage = app ? firebase.storage() : null;
export { firebase }; // Export the core firebase object for FieldPath etc.

// إعداد مزود جوجل
const provider = app ? new firebase.auth.GoogleAuthProvider() : null;
if (provider) {
    provider.setCustomParameters({ prompt: 'select_account' });
}
export const googleProvider = provider;


// التوثيق الثانوي (لإدارة المستخدمين من قبل الأدمن)
export let secondaryAuth: firebase.auth.Auth | null = null;
try {
    const secondaryAppName = "SecondaryAdminApp";
    const existingApp = firebase.apps.find(a => a.name === secondaryAppName);
    const secApp = existingApp || firebase.initializeApp(firebaseConfig, secondaryAppName);
    secondaryAuth = secApp.auth();
} catch (e) {
    console.warn("Secondary Auth failed to load (Check env vars):", e);
}
