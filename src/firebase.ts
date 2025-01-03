import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBnga12QoX5ns2NyGJwITmR9suJ8TlzNA0",
    authDomain: "bookstore-5220c.firebaseapp.com",
    projectId: "bookstore-5220c",
    storageBucket: "bookstore-5220c.firebasestorage.app",
    messagingSenderId: "1019305412746",
    appId: "1:1019305412746:web:3b9d3277308e1ce3a70573",
    measurementId: "G-RG95BSG911"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();



