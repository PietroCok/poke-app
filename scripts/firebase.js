import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, deleteUser} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, remove, off } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

let app, auth, database;
let userActive = false;

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
      console.log(user);
      
      // user logged in
      firebase.isUserActive(user);
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
  return await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // signed in
      console.log("signIn", userCredential);
      closeDialog('sign-in');
      return true;
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
      return false;
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
  return await signOut(auth).then(() => {
    userActive = false;
    console.log('User signed out!')
    // Sign-out successful.
    return true;
  }).catch((error) => {
    // An error happened.
    console.warn(error);
    return false;
  });
}

firebase.deleteAccount = async function(){
  let failError = '';
  let result = await deleteUser(auth.currentUser)
    .then(() => {
      return true;
    })
    .catch((error) => {
      console.warn(error.code)
      failError = error.code;
      return false;
    })
  
  if(!result && failError == 'auth/requires-recent-login'){
    // force user to login again
    openSignIn("La cancellazione richiede un accesso recente, conferma le credenziali e prova di nuovo!");

    return false;
  }

  return result;
}

firebase.deleteAccountRecord = async function(){
  const uid = this.getUserUid();
  if(!uid) return false;

  const path = `/users`;

  const result = await update(ref(database, path), {
    [uid]: null
  }).then(() => {
    return true;
  }).catch((error) => {
    console.warn(error);
    return false;
  })

  return result;
}

firebase.userActive = function(){
  return userActive || false;
}

firebase.getUserUid = function(){
  return auth?.currentUser?.uid || '';
}

firebase.getUserEmail = function(){
  return auth?.currentUser?.email || '';
}

firebase.isUserActive = async function(user){
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
 * 
 */
firebase.addItemTocart = async function(item , cartId){
  if(!cartId || !item) return false;
  
  item.createdBy = firebase.getUserUid();

  const path = getItemsPath(cartId);
  const result = await update(ref(database, path), {
    [item.id] : item
  })
  .then(() => {
    console.log("Item added to cart: ", item, cartId)
    return true;
  })
  .catch(error => {
    console.warn(error);
    new Notification({
      message: "Errore durante l'aggiunte dell'elemento al carrello condiviso!",
      gravity: 'error'
    })
  });

  console.log(result);

  return result;
}

/**
 * 
 */
firebase.updateItemInCart = async function(item, cartId){
  if(!cartId || !item) return false;

  const path = getItemsPath(cartId);
  const result = await update(ref(database, path), {
    [item.id] : item
  })
  .then(() => {
    console.log("Item updated in cart: ", item, cartId)
    return true;
  })
  .catch(error => {
    console.warn(error);
    if(error.code == "PERMISSION_DENIED"){
      new Notification({
        message: "Non puoi modificare un elemento creato da un altro utente!",
        gravity: 'error'
      })
    } else {
      new Notification({
        message: "Errore durante la modifica dell'elemento!",
        gravity: 'error'
      })
    }
    return false;
  });

  return result;
}

/**
 * 
 */
firebase.removeItemFromCart = async function(itemId, cartId){
  if(!cartId || !itemId) return false;

  const path = getItemsPath(cartId);
  const result = await update(ref(database, path), {
    [itemId] : null
  })
  .then(() => {
    console.log("Item removed from cart: ", itemId, cartId)
    return true;
  })
  .catch(error => {
    console.warn(error);
    if(error.code == "PERMISSION_DENIED"){
      new Notification({
        message: "Non puoi modificare un elemento creato da un altro utente!",
        gravity: 'error'
      })
    } else {
      new Notification({
        message: "Errore durante l'eliminazione dell'elemento!",
        gravity: 'error'
      })
    }
    return false;
  });

  return result;
}

/**
 * Adds shared cart to db
 * @param {Object} cart 
 * @returns 
 */
firebase.addSharedCart = async function(cart){
  if(!cart) return;

  cart.createdBy = firebase.getUserUid();

  // check if all items have the createdBy property
  for(const item of Object.values(cart.items)){
    if(!item.createdBy)  item.createdBy = firebase.getUserUid();
  }

  const key = `cart-${cart.id}`;
  const result = await update(ref(database, `/${paths.sharedCarts}`), {
    [key] : cart
  }).catch(error => error);

  if(!result){
    // listen for edits on carts
    observeCart(cart.id);
    new Notification({
      message: "Carrello condiviso creato!"
    })
  } else {
    new Notification({
      message: "Errore in creazione del carrello condiviso!",
      gravity: 'error'
    })
    console.warn(result);
  }
}

/**
 * Removes shared cart from db
 * @param {String} cartId 
 * @returns 
 */
firebase.removeSharedCart = async function(cartId){
  if(!cartId) return;

  const path = getCartPath(cartId);

  const result = await remove(ref(database, path))
  .then(() => {
    console.log(`Node at path: ${path} removed!`);
    return true;
  })
  .catch(error => {
    console.warn(error);
    if(error.code == "PERMISSION_DENIED"){
      new Notification({
        message: "Non puoi eliminare un carrello creato da un altro utente!",
        gravity: 'error'
      })
    } else {
      new Notification({
        message: "Errore durante l'eliminazione del carrello condiviso!",
        gravity: 'error'
      })
    }
    return false;
  });

  return result;
}

firebase.getSharedCarts = async function(){
  const carts = await get(ref(database, `/${paths.sharedCarts}`)).then((snapshot) => {
    if (snapshot.exists()) {
      sharedCartCache = Object.values(snapshot.val());
    } else {
      console.log("No data available");
      sharedCartCache = [];
    }
    return sharedCartCache;
  }).catch((error) => {
    console.error(error);
    return null;
  });

  return carts;
}

const observePath = async function(path, callback){
  onValue(ref(database, path), (snapshot) => {
    let data = snapshot.val();
    console.log(path);
    
    if(data){
      callback(data);
    } else {
      console.log('Data not on server anymore: ' + path)
      if(path.indexOf('shared-carts') > 0 && path.indexOf('cart-') > 0 && path.indexOf('item-') < 0){
        // catturata cancellazione del carrello
        callback({
          id: path.slice(path.lastIndexOf('-')+1),
          deleted: true
        })
      } else {
        off(ref(database, path));
      }
    }
  });
}

/**
 * 
 * @param {String} path - path to observe for changes
 * @param {Function} callback - function to be called when data changes
 */
firebase.observeCart = async function(cartId, callback){
  const path = getCartPath(cartId);
  observePath(path, callback);
}

/**
 * 
 */
firebase.stopObserveCart = async function(cartId){
  if(!cartId) return;
  const path = getCartPath(cartId);
  off(ref(database, path));
}


/**
 * Returns cart path on db
 * @param {String} cartId 
 * @returns 
 */
const getCartPath = function(cartId){
  return `/${paths.sharedCarts}/cart-${cartId}`;
}

const getItemsPath = function(cartId){
  return `${getCartPath(cartId)}/items`;
}