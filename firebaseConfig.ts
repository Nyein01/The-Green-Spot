import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNbaGjHax-W4T8nvQ22J1PhL8ttu9xGpQ",
  authDomain: "green-spot-41030.firebaseapp.com",
  databaseURL: "https://green-spot-41030-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "green-spot-41030",
  storageBucket: "green-spot-41030.firebasestorage.app",
  messagingSenderId: "602147765172",
  appId: "1:602147765172:web:c09fa24a0f32f953f890e1",
  measurementId: "G-S2KMW3583Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);