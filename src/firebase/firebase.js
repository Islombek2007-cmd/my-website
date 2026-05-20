import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCtI-eTl0gZpleEPDwUJjBBQjLhvh9PewI",
  authDomain: "i707website.firebaseapp.com",
  projectId: "i707website",
  storageBucket: "i707website.firebasestorage.app",
  messagingSenderId: "274659093502",
  appId: "1:274659093502:web:e33ceb1bce3c475ff9aeaf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);