
// Fix: Use namespaced import style for Firebase to resolve "no exported member" errors
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

/**
 * إعدادات Firebase
 * تم تحديث الإعدادات لربط المنصة بمشروعك الحقيقي.
 */
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
  // Fix: Use namespaced initialization
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  googleProvider = new firebase.auth.GoogleAuthProvider();
  console.log("Firebase initialized successfully with Project ID:", firebaseConfig.projectId);
} catch (e) {
  console.warn("Firebase initialization failed. Check console for details.", e);
  console.log("App falling back to LocalStorage mode where applicable.");
}

export { db, auth, googleProvider };
