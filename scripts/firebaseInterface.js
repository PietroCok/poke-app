let firebase = {};

// Tries to log in users
async function userLogin() {
  if(!firebase) return;

  const email = document.getElementById('sign-in-user-email').value;
  const password = document.getElementById('sign-in-user-pwd').value;

  if(!email || !password){
    new Notification({
      message: 'Email e password non possono essere vuote!',
      gravity: 'error',
      targetId: 'toast-container-sign-in'
    });
    return;
  }

  firebase.signIn(email, password);
}

async function userSignup() {
  if(!firebase) return;

  const email = document.getElementById('sign-up-user-email').value;
  const password = document.getElementById('sign-up-user-pwd').value;
  const password_check = document.getElementById('sign-up-user-pwd-check').value;

  if(!email || !password || !password_check){
    new Notification({
      message: 'Email e password non possono essere vuote!',
      gravity: 'error',
      targetId: 'toast-container-sign-up'
    });
    return;
  }

  if(!checkEmailFormat(email)){
    new Notification({
      message: 'Mail non valida!',
      gravity: 'error',
      targetId: 'toast-container-sign-up'
    })
    return;
  }

  if(!checkPasswordFormat(password)){
    new Notification({
      message: 'Password troppo corta: min 6 caratteri!',
      gravity: 'error',
      targetId: 'toast-container-sign-up'
    })
    return;
  }

  if(password != password_check){
    new Notification({
      message: 'Le password non corrispondono!',
      gravity: 'error',
      targetId: 'toast-container-sign-up'
    });
    return;
  }

  firebase.signUp(email, password);
  closeDialog('sign-up');
}

async function handleLogin(success = false, active = false, notification = true){
  if(!firebase) return;

  if(success){
    // logged
    // always show user icon to logout and change account
    document.getElementById('user-logged-container').classList.remove('hidden');
    document.getElementById('open-login-container').classList.add('hidden');

    if(active){
      // show also shared carts menu
      document.getElementById('shared-carts-menu').classList.remove('hidden');
      new Notification({
        message: 'Accesso eseguito!',
        gravity: 'info'
      })
    } else {
      new Notification({
        message: 'Utente NON abilitato. Contattare un amministratore!',
        gravity: 'warn'
      })
    }

  } else {
    // not logged
    document.getElementById('open-login-container').classList.remove('hidden');
    document.getElementById('user-logged-container').classList.add('hidden');
    document.getElementById('shared-carts-menu').classList.add('hidden');
    return;
  }

  // check if url has a cart code
  const urlParams = new URLSearchParams(window.location.search)
  const invitedCartId = urlParams.get('cart');
  const cartname = urlParams.get('cart-name');
  if(invitedCartId){
    // check if user is already invited
    handleCartInvite(invitedCartId, cartname);
  }

  // check if current loaded cart is a shared cart and listen for it
  const localCart = getCart();
  if(localCart.shared) {
    observeCart(localCart.id);
  }
}

async function generatedCartLink(cartId, name){
  if(!cartId) return;

  const inviteLink = window.location.origin + window.location.pathname + "?cart=" + cartId + "&cart-name=" + name;

  if(clipboard.navigator){
    await navigator.clipboard.writeText(inviteLink);

    new Notification({
      message: "Link di invito copiato negli appunti!"
    })
  } else {
    // clipboard not supported
    alert("Link di invito: " + inviteLink)
  }
}

async function handleCartInvite(id, name){
  console.log('invited to shared cart: ', id, name);
  const alreadyAdded = await firebase.isCartAccessible(id);
  if(alreadyAdded){
    // load cart into local cart
    loadSharedCart(id);

    clearUrl();
  } else {
    // ask user if wants to adds the cart
    addUserToCart(id, name);
  }
}

async function addUserToCart(cartId, cartName, ask = true){
  if(!cartId) return false;

  if(ask){
    _confirm(`Sei stato invitato al carrello condiviso: ${cartName}.<div class="margin-10">Confermi la partecipazione?</div>`, () => addUserToCart(cartId, cartName, false));
    return false;
  }

  const result = firebase.addCartToUser(`cart-${cartId}`);
  if(result){
    clearUrl();
    new Notification({
      message: `Carrello condiviso ${cartName} ora disponibile!`
    })

    // load cart into local cart
    loadSharedCart(cartId);
  }
}

function clearUrl(){
  history.replaceState({}, '', window.location.origin + window.location.pathname);
}

function isUserActive(){
  return firebase?.userActive() || false;
}

// Signs user out
async function logout(ask = true){
  if(!firebase) return;

  // ask for comfirmation
  if(ask){
    _confirm("Sei sicuro di volerti disconnettere?", () => logout(false));
    return;
  }

  // logout
  const result = firebase.signOut();

  if(result){
    handleLogin(false, false);

    new Notification({
      message: 'Utente disconnesso!'
    })
  }

  closePage('user-profile')
}

function getUserEmail(){
  return firebase?.getUserEmail() || '';
}


// SHARED CARTS

// Creates a new shared cart
async function createSharedCart(fromDialog = false){
  if(!firebase) return;

  if(!fromDialog){
    // opens custom dialog for cart creation
    const newSharedCartDialog = document.getElementById('new-shared-cart');
    if(newSharedCartDialog) newSharedCartDialog.showModal();
    return;
  }

  // actual shared cart creation
  const name = document.getElementById('new-shared-cart-name');
  const loadCurrent = document.getElementById('load-now');
  
  let sharedCart = {};
  if(loadCurrent.checked){
    sharedCart = getCart();
    // if cart is already a shared => duplicate by using another id
    if(sharedCart.shared){
      sharedCart.id = getRandomId(40);
    }
  } else {
    sharedCart.id = getRandomId(40);
  }

  sharedCart.name = name.value;
  sharedCart.shared = true;

  // load created cart in local cart
  saveCart(sharedCart);

  // dialog field reset to default
  name.value = '';
  loadCurrent.checked = true;

  console.log('Creating new shared cart!', sharedCart);
  
  await firebase.addSharedCart(sharedCart);

  drawCartItems();

  closeDialog('new-shared-cart');
}

/**
 * 
 * @param {Object} item - Item to be added to the cart
 * @returns 
 */
async function addItemToSharedCart(item){
  if(!firebase) return false;

  await firebase.addItemTocart(item, getCart()?.id || null);
}

/**
 * 
 * @param {String} id - id of item to remove 
 * @returns 
 */
async function removeItemFromSharedCart(item){
  if(!item || !firebase) return false;

  // check if userid is the same as creator of the item
  if(getCart().createdBy != firebase.getUserUid() && item.createdBy != firebase.getUserUid()){
    new Notification({
      message: "Non puoi rimuovere un elemento creato da un altro utente!",
      gravity: 'error'
    })
    return false;
  }

  const result = await firebase.removeItemFromCart(item.id, getCart()?.id || null);
  
  if(result){
    delete getCart()?.items[item.id];
  }
  return result;
}


/**
 * 
 * @param {Object} item - item to update on cart
 * @returns 
 */
async function editItemInSharedCart(item){
  if(!firebase || !item) return false;

  // check if userid is the same as creator of the item
  if(item.createdBy != firebase.getUserUid()){
    new Notification({
      message: "Non puoi modificare un elemento creato da un altro utente!",
      gravity: 'error'
    })
    return false;
  }

  const result = await firebase.updateItemInCart(item, getCart()?.id || null)
  return result;
}


/**
 * Removes all item from shared cart but keeping the cart
 */
async function clearRemoteCart(cartId){
  const result = await firebase.removeAllItemsFromCart(cartId)
  if(!result){
    new Notification({
      messagge: "Errore durante la cancellazione degli elementi nel carrello condiviso!",
      gravity: 'error'
    })
  }

  return result;
}


/**
 * Retrieves keys information about available shared carts
 */
function openSharedCarts(){
  closeAllPages();
  drawSharedCarts();
  closeMenu();
}

/**
 * Loads shared cart into local cart, then add observer to get changes in realtime
 * 
 * @param {String} id 
 */
async function loadSharedCart(id){
  console.log('Loading cart: ', id, sharedCartCache);
  
  let sharedCart = sharedCartCache[id];
  if(!sharedCart){
    // try to update the cache
    sharedCartCache = await firebase.getSharedCarts();
    sharedCart = sharedCartCache[id];

    if(!sharedCart){
      new Notification({
        message: 'Qualcosa è andato storto durante il recupero del carrello condisivo',
        gravity: 'error'
      });
      return;
    }
  }

  sharedCart.shared = true;

  saveCart(sharedCart);

  openCart();

  observeCart(id);

  closePage('shared-carts-selection');
}

function observeCart(cartId){
  firebase.observeCart(cartId, handleDataChange);
}

function handleDataChange(data){
  console.log('Shared cart data changed: ', data);
  
  // update current local cart
  const cart = getCart();
  if(cart.id != data.id){
    return;
  }

  if(data.deleted){
    cart.shared = false;
    // shared cart deleted on server are not deleted on local device
    // update local cache for cart
    delete sharedCartCache[data.id];
    saveCart(null)
  } else {
    // update local cache for cart
    let local = sharedCartCache[data.id];
    if (local){
      local = data;
    } else {
      sharedCartCache[data.id] = data;
    }
    saveCart(data);
  }
}

/**
 * Deletes a shared cart
 * 
 * @param {String} cartId 
 */
async function deleteSharedCart(cartId, ask = true){
  if(ask){
    _confirm("Eliminare il carrello condiviso?", () => deleteSharedCart(cartId, false))
    return;
  }

  console.log(sharedCartCache);
  const cartToRemove = sharedCartCache[cartId];
  if(!cartToRemove) return;

  // if cart is shared and i'm not the creator i remove the cart from the one i have access to
  if(cartToRemove.createdBy != firebase.getUserUid()){
    if(await firebase.removeCartAccess(cartId)){
      clearCart(true, true);
    }
    return;
  }

  const result = await firebase.removeSharedCart(cartId);

  if(result){
    clearCart(true);
  }
}

/**
 * Scollega carrello condiviso
 */
function unlinkSharedCart(){
  firebase.stopObserveCart(getCart()?.id);
  clearCart(true, true);
}


// local cache for shared carts
let sharedCartCache = {};
async function drawSharedCarts(){
  sharedCartCache = {};
  if(!firebase) return;

  showLoadingScreen();
  const sharedCarts = await firebase.getSharedCarts();

  const sharedPage = document.getElementById('shared-cart-selection');
  const container = document.getElementById('shared-cart-selection-container');
  container.innerHTML = '';

  for(const id in sharedCarts){
    const cart = sharedCarts[id];
    const cartItems = Object.values(cart.items || {}).length || 0;
    sharedCartCache[id] = cart;

    const elemStr = 
    `<div class="cart-container flex just-between align-center border-color border-r-10 padding-10">
      <div class="cart-name flex-1 text-left margin-10">${cart.name}</div>
      <div class="cart-items flex gap-1" title="Elementi nel carrello">
        <span class="flex align-center">${cartItems}</span>
        <div class="flex align-center">
          <i class="fa-solid fa-bowl-food"></i>
        </div>

        <div title="Carica nel carrello" class="button icon icon-only icon-small accent-2" onclick="loadSharedCart('${cart.id}')">
          <i class="fa-solid fa-cart-shopping"></i>
        </div>
      </div>
    </div>`;

    const elem = convertToHTML(elemStr);
    container.append(elem);
  }

  hideLoadingScreen();

  sharedPage.classList.remove('hidden');
}


function openProfile(){
  if(!firebase) return;
  if(!firebase.getUserUid()) return;
  closeMenu();
  closeAllPages();
  
  const page = document.getElementById('user-profile');
  if(!page) return; 
  drawProfilePage();
  page.classList.remove('hidden');
}

async function drawProfilePage(){
  const profileContainer = document.getElementById('user-profile-container');
  if(!profileContainer) return;
  profileContainer.innerHTML = '';

  const emailVerified = firebase.isEmailVerified();
  const userActive = isUserActive();
  const userStatus = userActive ? 'Attivo' : 'Non attivo';

  const emailElem = 
  `<div class="flex gap-1 align-center">
    <div for="user-profile-email" class="label margin-10">Email</div>

    <input type="text" id="user-profile-email" class="input flex-1 w-20 text-right ${emailVerified ? 'accent-info' : 'accent-warn'}" title="Email ${emailVerified ? 'verficata' : 'non verificata'}" value="${getUserEmail()}" disabled>
  </div>`;

  const verifyEmail = 
  `
  <div class="flex just-end">
    <button onclick="verifyEmail()" class="accent-3-invert button text-button w-fit">Verifica la tua mail</button>
  </div>
  `;

  // shown only if email is verified
  const editEmail = '';
  const resetPassword = 
  ``;

  const statusElem = 
  `<div class="flex gap-1 align-center">
    <div for="user-profile-status" class="label margin-10">Stato account</div>

    <input type="text" id="user-profile-status" class="input flex-1 w-20 text-right ${userActive ? 'accent-info' : 'accent-warn'}" value="${userStatus}" disabled>
  </div>`;

  profileContainer.insertAdjacentHTML('beforeend', emailElem);
  if(!emailVerified) {
    profileContainer.insertAdjacentHTML('beforeend', verifyEmail)
  }
  profileContainer.insertAdjacentHTML('beforeend', statusElem);
}


async function passwordReset(ask = true){
  // check if mail is correct
  const email = document.getElementById('sign-in-user-email');

  if(!email.value){
    new Notification({
      message: "Inserire un indirizzo mail!",
      gravity: "warn",
      targetId: "toast-container-sign-in"
    })
    return;
  }

  if(ask){
    _confirm("Conferma invio email per reset della password?", () => {passwordReset(false)})
    return;
  }

  const result = await firebase.passwordReset(email.value);

  closeDialog('sign-in');
  if(result){
    new Notification({
      message: 'Email per il reset della password inviata!',
      displayTime: 2
    })
  } else {
    new Notification({
      message: "Errore durante l'invio della mail per il reset della password!",
      gravity: "error"
    })
  }
}


// starts procedure to verify the user email
async function verifyEmail(ask = true){

  if(ask){
    _confirm("Iniziare la procedura di verifica della mail?<div class='text-normal margin-10'>Questa operazione richiede che l'utente abbia accesso all'account di posta</div>", () => {verifyEmail(false)})
    return;
  }

  // new Notification({
  //   message: "Funzionalità non ancora disponibile!",
  //   gravity: 'warn',
  //   displayTime: 2
  // })
  // return;

  firebase.verifyEmail();
}

async function deleteAccount(ask = true){
  if(ask){
    _confirm("Confermi la cancellazione dell'account?<br> L'operazione non è reversibile!", () => deleteAccount(false));
    return;
  }

  // delete from database
  let result = await firebase.deleteAccountRecord();
  if(!result){
    new Notification({
      message: "Si è verificato un problema durante l'eliminazione dell'account",
      gravity: 'error'
    })
    return;
  }

  // delete from authentication
  result = await firebase.deleteAccount();

  if(result) {
    new Notification({
      message: "Utente eliminato con successo"
    })

    setTimeout(() => window.location.reload(), 1000);
  } else {
    new Notification({
      message: "Si è verificato un problema durante l'eliminazione dell'account",
      gravity: 'error'
    })
  }
}

function openSignIn(message = ''){
  closeDialog('sign-up');
  if(message) {
    const target = document.getElementById('sign-in-message');
    target.textContent = message;
  }
  const dialog = document.getElementById('sign-in');
  dialog.showModal();
}

function openSignUp(){
  closeDialog('sign-in');
  const dialog = document.getElementById('sign-up');
  dialog.showModal();
}

function afterSignOut(){
  // unlink local cart if shared
  unlinkSharedCart();
}