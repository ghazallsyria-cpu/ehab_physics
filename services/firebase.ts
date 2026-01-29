
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import "firebase/compat/storage";

// مفاتيح التكوين الثابتة لضمان عمل التطبيق (Hardcoded for stability)
const firebaseConfig = {
  apiKey: "AIzaSyAwbn6xMl8RZ52cWk571CS_hI4Qo9Kh1VY",
  authDomain: "physi-kuwait-prod-46032.firebaseapp.com",
  projectId: "physi-kuwait-prod-46032",
  storageBucket: "physi-kuwait-prod-46032.firebasestorage.app",
  messagingSenderId: "27783754762",
  appId: "1:27783754762:web:fa0065227eed7e52081bf3"
};

// تهيئة التطبيق الأساسي مع معالجة الأخطاء
let app;
try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    } else {
        app = firebase.app();
    }
} catch (error) {
    console.error("Firebase Initialization Critical Error:", error);
}

// تصدير الخدمات بأمان
// إذا فشلت التهيئة، ستكون هذه المتغيرات غير معرفة، لذا يجب التعامل معها بحذر في الملفات الأخرى
export const db = app ? firebase.firestore() : null;
export const auth = app ? firebase.auth() : null;

// إعداد مزود جوجل
const provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = provider;

// التوثيق الثانوي (لإدارة المستخدمين)
export let secondaryAuth: firebase.auth.Auth | null = null;
try {
    const secondaryAppName = "SecondaryAdminApp";
    const existingApp = firebase.apps.find(a => a.name === secondaryAppName);
    const secApp = existingApp || firebase.initializeApp(firebaseConfig, secondaryAppName);
    secondaryAuth = secApp.auth();
} catch (e) {
    console.warn("Secondary Auth failed to load:", e);
}
