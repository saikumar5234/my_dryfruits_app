import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyB0VPHNtniLb73G3a26pEzIUw11fJY4cFc",
  authDomain: "dryfruits-8a3f8.firebaseapp.com",
  projectId: "dryfruits-8a3f8",
  storageBucket: "dryfruits-8a3f8.appspot.com",
  messagingSenderId: "319848961362",
  appId: "1:319848961362:web:c0c4bc9b734910dd53568b",
  measurementId: "G-H1BD0XW4YW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app; 