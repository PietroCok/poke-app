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
      message: 'Formato mail non valido!',
      gravity: 'error',
      displayTime: 1.5,
      targetId: 'toast-container-sign-up'
    })
    return;
  }

  if(!checkPasswordFormat(password)){
    new Notification({
      message: 'Password troppo corta: inserisci una password lunga almeno 6 caratteri',
      gravity: 'error',
      displayTime: 1.5,
      targetId: 'toast-container-sign-up'
    })
    return;
  }

  if(password != password_check){
    new Notification({
      message: 'La password non corrisponde!',
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

  // check if current loaded cart is a shared cart and listen for it
  const localCart = getCart();
  if(localCart.shared) {
    observeCart(localCart.id);
  }
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
      sharedCart.id = getRandomId();
    }
  } else {
    sharedCart.id = getRandomId();
  }

  sharedCart.name = name.value;
  sharedCart.shared = true;
  sharedCart.items = null;

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
  if(!firebase || !item) return false;

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
function loadSharedCart(id){
  const sharedCart = sharedCartCache.find(cart => cart.id == id);
  if(!sharedCart){
    new Notification({
      message: 'Qualcosa è andato storto durante il recupero del carrello condisivo',
      gravity: 'error'
    });
    return;
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
    sharedCartCache.filter(cart => cart.id != data.id);
    saveCart(null)
  } else {
    // update local cache for cart
    let local = sharedCartCache.find(cart => cart.id != data.id);
    if (local){
      local = data;
    } else {
      sharedCartCache.push(data)
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
  const cartToRemove = sharedCartCache.find(cart => cart.id == cartId);
  if(!cartToRemove) return;

  // check if userid is the same as creator of the item
  if(cartToRemove.createdBy != firebase.getUserUid()){
    new Notification({
      message: "Non puoi eliminare un carrello creato da un altro utente!",
      gravity: 'error'
    })
    return false;
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
let sharedCartCache = [];
async function drawSharedCarts(){
  sharedCartCache = [];
  if(!firebase) return;

  showLoadingScreen();
  const sharedCarts = await firebase.getSharedCarts();

  const sharedPage = document.getElementById('shared-cart-selection');
  const container = document.getElementById('shared-cart-selection-container');
  container.innerHTML = '';

  for(const id in sharedCarts){
    const cart = sharedCarts[id];
    const cartItems = Object.values(cart.items || {}).length || 0;

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
  if(page) page.classList.remove('hidden');

  // build page
  const container = document.getElementById('user-profile-container');
  const email = document.getElementById('user-profile-email');
  const status = document.getElementById('user-profile-status');
  if(email) email.value = getUserEmail();
  if(status) status.value = isUserActive() ? 'Attivo' : 'Non attivo';
}

async function deleteAccount(ask = true){
  if(ask){
    _confirm("Confermi la cancellazione dell'account?<br> L'operazione non è reversibile!", () => deleteAccount(false));
    return;
  }

  // delete from database
  let result = await firebase.deleteAccountRecord();

  // delete from authentication
  result = await firebase.deleteAccount();

  if(result) {
    new Notification({
      message: "Utente eliminato con successo"
    })

    setTimeout(() => window.location.reload(), 1000);
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