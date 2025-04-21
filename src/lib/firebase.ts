
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD0mNtTagd7iNYqFfsK24l2364VJy5ImyE",
  authDomain: "bashkom---ecommerce.firebaseapp.com",
  databaseURL: "https://bashkom---ecommerce-default-rtdb.firebaseio.com",
  projectId: "bashkom---ecommerce",
  storageBucket: "bashkom---ecommerce.appspot.com",
  messagingSenderId: "1083353593749",
  appId: "1:1083353593749:web:0983c4a1f4c565f9a8a89c",
  measurementId: "G-FD3P4YCDXJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
