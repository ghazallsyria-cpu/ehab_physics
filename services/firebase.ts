
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const apiKey = process.env.API_KEY;

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "physi-kuwait-prod-46032.firebaseapp.com",
  projectId: "physi-kuwait-prod-46032",
  storageBucket: "physi-kuwait-prod-46032.firebasestorage.app",
  messagingSenderId: "27783754762",
  appId: "1:27783754762:web:fa0065227eed7e52081bf3",
  measurementId: "G-7WBG5PBVC2"
};

// تهيئة التطبيق الأساسي
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// تهيئة تطبيق ثانوي لإدارة عمليات Auth الخاصة بالمسؤول (لإنشاء مستخدمين دون تسجيل خروج المسؤول)
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
