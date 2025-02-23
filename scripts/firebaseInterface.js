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
      message: 'Qualcosa è andato storto, riprova più tardi!',
      gravity: 'error',
      targetId: 'toast-container-sign-in'
    });
  }
}

async function handleLogin(success = false){
  if(success){
    new Notification({
      message: 'Utente loggato con successo!',
      gravity: 'info',
    });
    document.getElementById('user-logged').classList.remove('hidden');
    document.getElementById('open-login').classList.add('hidden');
  } else {
    document.getElementById('user-logged').classList.add('hidden');
    document.getElementById('open-login').classList.remove('hidden');
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
    document.getElementById('user-logged').classList.add('hidden');
    document.getElementById('open-login').classList.remove('hidden');

    new Notification({
      message: 'Utente disconnesso!'
    })
  }
}