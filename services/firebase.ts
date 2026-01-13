
// import { initializeApp } from "firebase/app"; // Commented out to prevent errors
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";

/**
 * إعدادات Firebase
 * يجب استبدال القيم أدناه بالقيم الحقيقية من لوحة تحكم Firebase Console
 * Project Settings -> General -> Your apps -> SDK setup and configuration
 */
const firebaseConfig = {
  // 🔴 استبدل هذه القيم ببيانات مشروعك الحقيقي
  apiKey: "AIzaSyD-YOUR-REAL-API-KEY-HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

let app: any;
let db: any = null;
let auth: any = null;

try {
  // Initialize Firebase only if the apiKey is not the placeholder
  // This allows the app to fallback to LocalStorage (Demo Mode) automatically
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyD-YOUR-REAL-API-KEY-HERE") {
    // app = initializeApp(firebaseConfig);
    // db = getFirestore(app);
    // auth = getAuth(app);
    console.log("Firebase initialized successfully (Mocked)");
  } else {
    console.debug("Firebase config placeholder detected. App will use LocalStorage fallback.");
  }
} catch (e) {
  console.warn("Firebase initialization failed:", e);
}

export { db, auth };
