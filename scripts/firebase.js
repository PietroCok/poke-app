import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

firebase.signIn = signIn;

const firebaseConfig = {
  apiKey: "AIzaSyBT-bk__Ft7uiBIRA9SriDdvVsHPFLp8B8",
  authDomain: "testing-grounds-d59c4.firebaseapp.com",
  databaseURL: "https://testing-grounds-d59c4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "testing-grounds-d59c4",
  storageBucket: "testing-grounds-d59c4.firebasestorage.app",
  messagingSenderId: "934551744902",
  appId: "1:934551744902:web:ab91aec74058e5c2b83c07"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

// authentication
async function signIn(email, password){
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up 
      const user = userCredential.user;
      loginResult = true;
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      loginResult = false;
      console.warn(errorCode, errorMessage);
    });
}
