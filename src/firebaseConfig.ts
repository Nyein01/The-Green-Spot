import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRcReY37C7Ab0cjdUv638i34CSebnmokw",
  authDomain: "the-green-spot-a1f66.firebaseapp.com",
  projectId: "the-green-spot-a1f66",
  storageBucket: "the-green-spot-a1f66.firebasestorage.app",
  messagingSenderId: "741956597265",
  appId: "1:741956597265:web:31ef1f65405a5c609f23b0",
  measurementId: "G-D8D9VX0BSQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);