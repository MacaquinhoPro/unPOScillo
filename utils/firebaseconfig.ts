import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";



const firebaseConfig = {
  apiKey: "AIzaSyAbq_9ucB7hUI8Rq3SKCBx4Nx458fed8to",
  authDomain: "unposcillo.firebaseapp.com",
  projectId: "unposcillo",
  storageBucket: "unposcillo.firebasestorage.app",
  messagingSenderId: "763821041163",
  appId: "1:763821041163:web:713ef1fc9d377a1b04890e",
  measurementId: "G-MYM2XGSP66"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { firebaseConfig };
export const storage = getStorage(app);