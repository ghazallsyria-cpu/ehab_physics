import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwbn6xMl8RZ52cWk571CS_hI4Qo9Kh1VY",
  authDomain: "physi-kuwait-prod-46032.firebaseapp.com",
  projectId: "physi-kuwait-prod-46032",
  storageBucket: "physi-kuwait-prod-46032.firebasestorage.app",
  messagingSenderId: "27783754762",
  appId: "1:27783754762:web:fa0065227eed7e52081bf3",
  measurementId: "G-7WBG5PBVC2"
};

// Initialize Main App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Secondary App for Admin Actions (to prevent session swapping)
const secondaryApp = !getApps().find(a => a.name === "Secondary") 
  ? initializeApp(firebaseConfig, "Secondary") 
  : getApp("Secondary");
export const secondaryAuth = getAuth(secondaryApp);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
export const googleProvider = provider;