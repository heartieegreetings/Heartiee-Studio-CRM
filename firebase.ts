// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// PASTE YOUR COPIED CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyDHRoPHJE9U_P4xMPvTX2qdjdO6xIfz7dg",
  authDomain: "heartiee-studio-crm.firebaseapp.com",
  projectId: "heartiee-studio-crm",
  storageBucket: "heartiee-studio-crm.firebasestorage.app",
  messagingSenderId: "165091777642",
  appId: "1:165091777642:web:45ff35b6d74b6c6728fe13"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };