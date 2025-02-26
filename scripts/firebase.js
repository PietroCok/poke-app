import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, remove, off } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

let app, auth, database;

const paths = {
  sharedCarts : 'shared-carts'
}

firebase.init = async function(firebaseConfig){
  if(!firebaseConfig) {
    console.warn('Firebase configuration not found!');
    firebase = null;
    return;
  }
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  if(!app) {
    firebase = null;
    return;
  }

  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app);
  if(!auth) {
    firebase = null;
    return;
  }

  // Initialize Realtime Database and get a reference to the service
  database = getDatabase(app);
  if(!database) {
    firebase = null;
    return;
  }

  console.log('Firebase Initialized!');

  onAuthStateChanged(auth, (user) => {
    console.log('auth change');
    if (user) {
      // user logged in
      isUserActive(user);
    } else {
      // user not logged in
      console.log('User not logged in!');
      userActive = false;
      handleLogin(false);
    }
  });
}


// authentication
firebase.signIn = async function(email, password){
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // signed in
      console.log("signIn", userCredential);
      closeDialog('sign-in');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.warn(errorCode, errorMessage);

      if(errorCode == "auth/invalid-credential"){
        new Notification({
          message: 'Credenziali errate!',
          gravity: 'error',
          targetId: 'toast-container-sign-in'
        })
      } else {
        new Notification({
          message: 'Ops, qualcosa è andato storto!',
          gravity: 'error',
          targetId: 'toast-container-sign-in'
        })
      }
    });
}

// account creation
firebase.signUp = async function(email, password){
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed up 
      console.log("signUp", userCredential);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.warn(errorCode, errorMessage);
      new Notification({
        message: 'Ops, qualcosa è andato storto!',
        gravity: 'error',
        targetId: 'toast-container-sign-up'
      })
    });
}

/**
 * Creates user record on db to handle account activation
 */
const createUserRecord = async function(user){
  set(ref(database, `/users/${user.uid}`), {
    email: user.email,
    status: "pending"
  })
  .then(() => {
    console.log('User account created!');
    handleLogin(true, false);
  })
  .catch(error => console.warn(error));
}

// logout
firebase.signOut = async function(){
  signOut(auth).then(() => {
    console.log('User singed out!')
    // Sign-out successful.
  }).catch((error) => {
    // An error happened.
    console.warn(error);
  });
}


let userActive = false;
firebase.userActive = function(){
  return userActive;
}

const isUserActive = async function(user){
  let currentUser = user;
  if(!currentUser){
    currentUser = auth?.currentUser;
  }
  if(!currentUser){
    return false;
  }

  return await get(ref(database, `/users/${currentUser.uid}/status`))
  .then((snapshot) => {
    if (snapshot.exists()) {
      // check account activation
      const status = snapshot.val();
      console.log('User: ' + currentUser.email + " => status: " + status);

      if(status== 'active'){
        userActive = true;
        handleLogin(true, true);
      } else {
        userActive = false;
        handleLogin(true, false);
      }
      
      return true;
    } else {
      // adding user record to database
      createUserRecord(currentUser);
    }
  }).catch((error) => {
    console.error(error);
    return false;
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
  const result = await update(ref(database, `/${paths.sharedCarts}`), {
    [key] : cart
  }).catch(error => error);

  observeCart(cart.id);
  
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
  const path = `/${paths.sharedCarts}/${key}`;

  await remove(ref(database, path))
  .then(() => console.log(`Node at path: ${path} removed!`))
  .catch(error => console.warn(error));
}

/**
 * Adds item to a shared cart
 * @param {String} cartId 
 * @param {Object} item 
 * @returns 
 */
firebase.addItemToCart = async function(cartId, item){
  return;
  if(!cartId || !item) return;

  const key = `item-${item.id}`;
  const result = await update(ref(database, `/${paths.sharedCarts}/cart-${cartId}`), {
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
  return;
  if(!cartId || !itemId) return;

  const key = `item-${itemId}`;
  const result = await update(ref(database, `/${paths.sharedCarts}/cart-${cartId}`), {
    [key] : null
  }).catch(error => error);
  
  return result;
}

firebase.getSharedCarts = async function(){
  const carts = await get(ref(database, `/${paths.sharedCarts}`)).then((snapshot) => {
    if (snapshot.exists()) {
      lastSharedCarts = Object.values(snapshot.val());
    } else {
      console.log("No data available");
      lastSharedCarts = [];
    }
    return lastSharedCarts;
  }).catch((error) => {
    console.error(error);
    return null;
  });

  return carts;
}

const observePath = async function(path, callback){
  onValue(ref(database, path), (snapshot) => {
    let data = snapshot.val();
    if(!data) {
      data = {
        deleted: true,
        id: path.slice(path.lastIndexOf('/')+1).replace('cart-', '')
      }
      console.log("Data deleted on server: ", data)
    };
    if(data.id == getCart().id){
      callback(data);
    } else {
      off(ref(database, path));
    }
  });
}

/**
 * 
 * @param {String} path - path to observe for changes
 * @param {Function} callback - function to be called when data changes
 */
firebase.observeCart = async function(cartId, callback){
  const path = `/${paths.sharedCarts}/cart-${cartId}`;
  observePath(path, callback);
}
