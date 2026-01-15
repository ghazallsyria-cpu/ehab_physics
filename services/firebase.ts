
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * إعدادات Firebase
 * تم تفعيل الإعدادات. يرجى التأكد من أن مفاتيح API أدناه صحيحة وتطابق مشروعك في Firebase Console.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBOKOR48inbN88UtVLKIRtQT7TUWvTktGo",
  authDomain: "physi-kuwait-prod-46032.firebaseapp.com",
  projectId: "physi-kuwait-prod-46032",
  storageBucket: "physi-kuwait-prod-46032.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

let app: any;
let db: any = null;
let auth: any = null;

try {
  // تهيئة Firebase بطريقة قياسية
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.warn("Firebase initialization failed (Check config):", e);
  console.log("App falling back to LocalStorage mode.");
  // Ensure db is null so db.ts logic switches to local storage
  db = null;
  auth = null;
}

export { db, auth };
