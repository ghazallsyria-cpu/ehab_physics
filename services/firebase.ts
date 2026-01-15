
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * إعدادات Firebase
 * تم تفعيل الإعدادات. يرجى التأكد من أن مفاتيح API أدناه صحيحة وتطابق مشروعك في Firebase Console.
 */
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAwbn6xMl8RZ52cWk571CS_hI4Qo9Kh1VY",
  authDomain: "physi-kuwait-prod-46032.firebaseapp.com",
  projectId: "physi-kuwait-prod-46032",
  storageBucket: "physi-kuwait-prod-46032.firebasestorage.app",
  messagingSenderId: "27783754762",
  appId: "1:27783754762:web:fa0065227eed7e52081bf3",
  measurementId: "G-7WBG5PBVC2"
};

let app: any;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;

try {
  // تهيئة Firebase بطريقة قياسية
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (e) {
  console.warn("Firebase initialization failed (Check config):", e);
  console.log("App falling back to LocalStorage mode.");
  // Ensure db is null so db.ts logic switches to local storage
  db = null;
  auth = null;
  googleProvider = null;
}

export { db, auth, googleProvider };
