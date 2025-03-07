import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, deleteUser, sendEmailVerification, sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
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
    console.log('auth state change');
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
    status: 'pending'
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

  const path = `/users/${uid}`;

  const result = await remove(ref(database, path))
  .then(() => {
    return true;
  }).catch((error) => {
    console.warn(error);
    return false;
  })

  return result;
}

function getUser(){
  return auth?.currentUser;
}

firebase.userActive = function(){
  return userActive || false;
}

firebase.getUserUid = function(){
  return getUser()?.uid || '';
}

firebase.getUserEmail = function(){
  return getUser()?.email || '';
}

firebase.isEmailVerified = function(){
  return getUser()?.emailVerified || false;
}

firebase.reloadUser = async function(){
  const user = getUser();
  if(user) await user.reload();
}

firebase.isUserActive = async function(user){
  let currentUser = user;
  if(!currentUser){
    currentUser = getUser();
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

      if(status && status == 'active'){
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


firebase.verifyEmail = async function(){
  sendEmailVerification(getUser())
  .then(() => {
    console.log('Verfication email sent!');
    // poll for a couple of minute to check if user actually verified the mail

    const pollInterval = 10; // seconds
    const maxPollTime = 3; // minutes
    let tries = 1;

    let emailVerificationPollingId = setInterval(async () => {
      const user = getUser();
      try {
        // Reload user to ensure we're getting the latest state
        await user.reload();

        if (user.emailVerified) {
          console.log("Email is verified!");
          clearInterval(emailVerificationPollingId);
          drawProfilePage();
        } else {
          console.log(`Email is not verified yet. (${tries}|${maxPollTime * 60 / pollInterval})`);
          tries += 1;
        }
      } catch (error) {
        console.error('Error during user reload:', error);
        clearInterval(emailVerificationPollingId);
      }
    }, pollInterval*1000);

    setTimeout(() => clearInterval(emailVerificationPollingId), maxPollTime*60*1000);
  })
  .catch((error) => {
    console.error(error);
  })
}

firebase.passwordReset = async function(email){
  const result = await sendPasswordResetEmail(auth, email)
  .then(() => {
    console.log('Password reset email sent!')
    return true;
  })
  .catch((error) => {
    console.warn(error);
    return false;
  });

  return result;
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

firebase.removeAllItemsFromCart = async function(cartId){
  if(!cartId) return;

  const path = getCartPath(cartId);
  const result = await update(ref(database, path), {
    items: null
  }).then(() => {
    console.log('Removed all time from remote cart')
    return true;
  }).catch((error) => {
    console.warn(error)
    return false;
  })

  return result;
}

/**
 * Adds shared cart to db
 * @param {Object} cart 
 * @returns 
 */
firebase.addSharedCart = async function(cart){
  if(!cart) return;

  // set ownership of cart
  cart.createdBy = firebase.getUserUid();

  const updates = {};
  const cart_path = `/shared-carts/cart-${cart.id}`;
  const accessible_carts_path = `/users/${this.getUserUid()}/carts/cart-${cart.id}`;

  updates[cart_path] = cart;
  updates[accessible_carts_path] = true;

  const result = await update(ref(database), updates)
  .then(() => true)
  .catch(error => {
    console.warn(error);
    return false;
  });

  if(result){
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
  // get uids of accessible carts
  const cartsId = await get(ref(database, `/users/${this.getUserUid()}/carts`))
  .then((snapshot) => {
    return snapshot.val();
  }).catch((error) => {
    console.error(error);
    return null;
  });

  if(!cartsId){
    return [];
  }

  const carts = [];
  // get informations about actuals carts
  for(const id in cartsId){
    const cart = await get(ref(database, `/shared-carts/${id}`))
    .then((snapshot) => {
      return snapshot.val();
    }).catch((error) => {
      console.error(error);
      return null;
    });

    if(cart){
      carts[cart.id] = cart;
    }
  }

  console.log(carts);

  return carts;
}

firebase.addCartToUser = async function(cartId){
  if(!cartId) return;

  const result = await update(ref(database, `/users/${this.getUserUid()}/carts`),{
    [cartId]: true,
  })
  .then(() => true)
  .catch((error) => {
    consolw.warn(error);
    return false;
  })

  return result;
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