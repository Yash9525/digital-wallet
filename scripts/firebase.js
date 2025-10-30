import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = { 
    apiKey: "AIzaSyBzF1agrBFFh4cC2DkmZKePf4-gjE05OQo", 
    authDomain: "review-world-1312e.firebaseapp.com", 
    projectId: "review-world-1312e", 
    storageBucket: "review-world-1312e.firebasestorage.app", 
    messagingSenderId: "372772434173", 
    appId: "1:372772434173:web:bfeb08e0c96886ace94", 
    measurementId: "G-X90GP8JTL8" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set log level
try {
    setLogLevel('Debug');
} catch (e) {
    console.warn("Could not set Firebase log level:", e);
}

// Constants
const ADMIN_UID = "mOs5Fmp4RoRzeBDH4pZLMOpQx7Q2";
const appId = 'digital-wallet-prod';

export { app, auth, db, ADMIN_UID, appId };
