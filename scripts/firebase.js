import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

let app, auth, database;

firebase.init = async function(firebaseConfig){
  if(!firebaseConfig) {
    console.warn('Firebase configuration not found!');
    return;
  }
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  if(!app) return;

  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  if(!auth) return;

  // Initialize Realtime Database and get a reference to the service
  database = getDatabase(app);
  if(!database) return;

  console.log('Firebase Initialized!');

  // handle auto login on page reload
  this.checkUserLogged();
}


// authentication
firebase.signIn = async function(email, password){
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

// logout
firebase.signOut = async function(){
  const result = await signOut(auth).then(() => {
    // Sign-out successful.
    return true;
  }).catch((error) => {
    // An error happened.
    console.warn(error);
    return false;
  });

  return result;
}

// check for user logged
firebase.checkUserLogged = async function(){
  onAuthStateChanged(auth, (user) => {
    if (user) {
      handleLogin(true);
    } else {
      handleLogin(false);
    }
  });
}

/**
 * Adds shared cart to db
 * @param {Object} cart 
 * @returns 
 */
firebase.addSharedCart = async function(cart){
  if(!cart) return;

  const key = `cart-${cart.id}`;
  const result = await update(ref(database, '/shared-carts'), {
    [key] : cart
  }).catch(error => error);
  
  return result;
}

/**
 * Removes shared cart from db
 * @param {String} cartId 
 * @returns 
 */
firebase.removeSharedCart = async function(cartId){
  if(!cartId) return;

  const key = `cart-${cartId}`;
  const result = await update(ref(database, `/shared-carts`), {
    [key] : null
  }).catch(error => error);
  
  return result;
}

/**
 * Adds item to a shared cart
 * @param {String} cartId 
 * @param {Object} item 
 * @returns 
 */
firebase.addItemToCart = async function(cartId, item){
  if(!cartId || !item) return;

  const key = `item-${item.id}`;
  const result = await update(ref(database, `/shared-carts/cart-${cartId}`), {
    [key] : item
  }).catch(error => error);
  
  return result;
}

/**
 * Removes item from shared cart
 * @param {String} cartId 
 * @param {String} itemId 
 * @returns 
 */
firebase.removeItemFromCart = async function(cartId, itemId){
  if(!cartId || !itemId) return;

  const key = `item-${itemId}`;
  const result = await update(ref(database, `/shared-carts/cart-${cartId}`), {
    [key] : null
  }).catch(error => error);
  
  return result;
}