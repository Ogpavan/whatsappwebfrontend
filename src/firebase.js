import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBK4gmrAzdfolGSJoNAbSNuriH_HeMjXVA",
  authDomain: "animaai-9d0d4.firebaseapp.com",
  projectId: "animaai-9d0d4",
  storageBucket: "animaai-9d0d4.appspot.com",
  messagingSenderId: "727068002897",
  appId: "1:727068002897:web:27bb2669294c301fbd0670",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
