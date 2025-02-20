const confirmDialog = document.getElementById('custom-confirm');
const confirmContainer = document.getElementById('custom-confirm-container');

/**
 * Custom version of default confirm functionality
 * 
 * @param {String} message - Message to be displayed
 * @param {Function} cbConfirm - callback function if user confirm the action
 * @returns 
 */
function _confirm(message, callback) {

  const elemStr =
  `<div>
    <div class='confirm-message margin-1-0 text-large'>${message}</div>

    <div class="button-wrapper gap-2 padding-0">
      <button id="abort" class="button text-button accent-1-invert">Annulla</button>
      <button id="confirm" class="button text-button accent-3-invert">Conferma</button>
    </div>
  </div>`;

  const elem = convertToHTML(elemStr);

  const confirmBtn = elem.querySelector('#confirm');
  confirmBtn.onclick = () => {
    confirmDialog.close();
    callback();
  };

  const abortBtn = elem.querySelector('#abort');
  abortBtn.onclick = () => {
    confirmDialog.close();
  };

  confirmContainer.innerHTML = '';
  confirmContainer.append(elem);
  confirmDialog.showModal();

  return false;
}

