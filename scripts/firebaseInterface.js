let firebase = {};
let loginResult = '';

// Tries to log in users
async function userLogin() {
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
  if(!fromDialog){
    // opens custom dialog for cart creation
    const newSharedCartDialog = document.getElementById('new-shared-cart');
    if(newSharedCartDialog) newSharedCartDialog.showModal();
    return;
  }

  // actual shared cart creation
  const name = document.getElementById('new-shared-cart-name');
  const loadNow = document.getElementById('load-now');
  
  const sharedCart = {
    name: name.value,
    id: getRandomId(),
    items: []
  }

  // dialog field reset
  name.value = '';

  console.log('Creating new shared cart!', sharedCart);
  
  const result = await firebase.addSharedCart(sharedCart);

  if(result){
    console.warn(result);
  }

  closeDialog('new-shared-cart');
}

function showSharedCarts(){

}
