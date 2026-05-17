import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Import other services as needed

const firebaseConfig = {
  apiKey: "AIzaSyCZFPeZkcg9JePq6jKhNL5TwCYDvO_qZgw",
  authDomain: "fixaway-prod-d0308.firebaseapp.com",
  projectId: "fixaway-prod-d0308",
  storageBucket: "fixaway-prod-d0308.firebasestorage.app",
  messagingSenderId: "595047441136",
  appId: "1:595047441136:web:ed741abafe8e9e2ce55835",
  measurementId: "G-0QFM0QENQ3"
};

// Initialize Firebase only if it hasn't been initialized yet (Next.js hot reloading safe)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services (we can add more as we use them)
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("🔥 Firebase Client App initialized successfully!");

export { app, auth, db, storage };
