let firebase = {};
let loginResult = '';

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
    new Notification({
      message: 'Utente loggato con successo!',
      gravity: 'info',
    });
    document.getElementById('user-logged').classList.remove('hidden');
    document.getElementById('open-login').classList.add('hidden');

    closeDialog('sign-in');
  } else {
    new Notification({
      message: 'Qualcosa è andato storto, riprova più tardi!',
      gravity: 'error',
      targetId: 'toast-container-sign-in'
    });
  }
}

async function checkLogin(){

}