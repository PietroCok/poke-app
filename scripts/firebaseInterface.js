let firebase = {};
let loginResult = '';

// Tries to log in users
async function userLogin() {
  if(!firebase) return;

  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-pwd').value;

  if(!email || !password){
    new Notification({
      message: 'Email e password non possono essere vuote!',
      gravity: 'error',
      targetId: 'toast-container-sign-in'
    });
    return;
  }

  await firebase.signIn(email, password);

  if(!loginResult) {
    handleLogin(true);
    closeDialog('sign-in');
  } else {
    new Notification({
      message: 'Credenziali errate!',
      gravity: 'error',
      targetId: 'toast-container-sign-in'
    });
  }
}

async function handleLogin(success = false, notification = true){
  if(!firebase) return;

  if(success){
    if(notification){
      new Notification({
        message: 'Utente loggato con successo!',
        gravity: 'info',
      });
    }
    // show
    document.getElementById('user-logged-container').classList.remove('hidden');
    document.getElementById('shared-carts-menu').classList.remove('hidden');
    // hide
    document.getElementById('open-login-container').classList.add('hidden');
  } else {
    // show
    document.getElementById('open-login-container').classList.remove('hidden');
    // hide
    document.getElementById('user-logged-container').classList.add('hidden');
    document.getElementById('shared-carts-menu').classList.add('hidden');
  }
}

// Checks if user is logged
async function checkLogin(){

}

// Signs user out
async function logout(ask = true){
  if(!firebase) return;

  // check if user is logged


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
  }
  sharedCart.name = name.value;
  sharedCart.id = getRandomId();

  // dialog field reset to default
  name.value = '';
  loadCurrent.checked = true;

  console.log('Creating new shared cart!', sharedCart);
  
  const result = await firebase.addSharedCart(sharedCart);

  if(result){
    console.warn(result);
  }

  closeDialog('new-shared-cart');
}


let lastSharedCarts = [];
/**
 * Retrieves keys information about available shared carts
 */
async function showSharedCarts(){
  lastSharedCarts = [];
  if(!firebase) return;

  showLoadingScreen();
  const sharedCarts = await firebase.getSharedCarts();

  const dialog = document.getElementById('shared-cart-selection');
  const container = document.getElementById('shared-cart-selection-container');
  container.innerHTML = '';

  console.log(sharedCarts);

  for(const id in sharedCarts){
    const cart = sharedCarts[id];

    const elemStr = 
    `<div class="cart-container flex just-between align-center">
      <div class="cart-name flex-1 text-left margin-10">${cart.name}</div>
      <div class="cart-items flex gap-1" title="Elementi nel carrello">
        <span class="flex align-center">${cart.items.length}</span>
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

  dialog.showModal();
}

/**
 * Loads shared cart into local cart, then add observer to get changes in realtime
 * 
 * @param {String} id 
 */
function loadSharedCart(id){
  const sharedCart = lastSharedCarts.find(cart => cart.id == id);
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

  // TODO add realtime sync with database

  closeDialog('shared-cart-selection');
}



