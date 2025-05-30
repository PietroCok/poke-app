/**
 * Opens cart page
 */
function openCart() {
  closeAllPages();
  drawCartItems();
  const cartElem = document.getElementById('cart');
  if (cartElem) cartElem.classList.remove('hidden');
}

/**
 * Retrieve cart from localStorage
 * 
 * @returns array of item in the cart
 */
function getCart() {
  // get cart from localStorage
  let cart;
  try {
    cart = JSON.parse(localStorage.getItem('cart'));
  } catch (error) {
    cart = null;
  }
  if (!cart) {
    cart = {
      id: getRandomId(),
      items: {}
    };
  }

  if(!cart.items && cart.shared){
    cart.items = {};
  }
  return cart;
}

/**
 * Loads the cart from localStorage
 */
function loadCart() {
  if(typeof getCart()?.length == 'number'){
    clearCart(true, true);
    return;
  }
  drawCartItems();
}

/**
 * Removes all items from cart and deletes it from localStorage
 * @param {boolean} [skipConfirm=false] - skips confirmation prompt
 * @param {boolean} [localOnly=true] - clear only local version of the cart
 */
async function clearCart(skipConfirm = false, localOnly = false) {
  if(!skipConfirm){
    _confirm("Svuotare il carrello?<br>L'operazione non è reversibile", () => clearCart(true));
    return;
  }

  const cart = getCart();
  if(!localOnly && cart?.shared && firebase){
    // remove all items from shared cart
    const result = clearRemoteCart(cart.id);
    if(!result){
      return;
    }
  }
  
  delete cart.shared;
  delete cart.createdBy;
  cart.items = {};
  cart.id = getRandomId(40);

  saveCart(cart);
  drawCartItems();
}


/**
 * Checks if item is already in the cart
*/
function isCarted(id) {
  const cart = getCart();
  if(!cart.items) return false;

  const alreadycarted = cart.items[id];
  if (alreadycarted) return true;
  return false;
}


/**
 * Add item from starred
 */
function addToCartFromStarred(id) {
  if (!id) return;

  if (isCarted(id)) {
    new Notification({
      message: "Elmento già aggiunto al carrello!",
      gravity: 'error'
    });
    return;
  }

  const starred = getStarred();

  const item = starred.find(i => i.id == id);

  addToCart(structuredClone(item));
  drawStarredItems();
}

/**
 * Add item to cart, then saves it to localStorage
 */
async function addToCart(item, allowDuplicate = false) {
  if (!item) return;

  const cart = getCart();
  const cartLimit = config.cart_limit;
  if(cartLimit && getCartItems().length >= cartLimit){
    new Notification({
      message: `Non è possibile aggiungere altri elementi al carrello, max (${cartLimit})`,
      gravity: 'warn',
      displayTime: 2
    })
    return;
  }

  let poke = structuredClone(item);

  // save correct name
  getName(poke);

  let prevItem = null;
  if (!poke.id || allowDuplicate) {
    // insert into cart
    poke.id = getRandomId();
  } else {
    prevItem = cart.items[`${poke.id}`];
    // if there's already an item in the cart with the same id
    // checks if current user can edit the elem
    // else treat as new item
    if (prevItem && !canEditItem(item)) {
      prevItem = null;
      poke.id = getRandomId();
    }
  }

  // remote update
  let operationResult = true;
  if(!prevItem){
    if(cart.shared){
      operationResult = await addItemToSharedCart(poke);
    }
    // nuovo inserimento
    if(operationResult){
      new Notification({
        message: "Salvato nel carrello"
      })
    } else {
      return;
    }
  } else {
    if(cart.shared){
      operationResult = await editItemInSharedCart(poke);
    }
    // aggiornamento
    if(operationResult){
      new Notification({
        message: "Aggiornato nel carrello"
      })
    } else {
      return;
    }
  }

  // local update
  cart.items[`${poke.id}`] = poke;

  saveCart(cart);
}

/**
 * Opens preview order dialog
 */
function showOrderPreview() {
  // check if at least one item in cart
  const cart = getCart();
  const cartItems = getCartItems();

  if (cartItems.length == 0) {
    new Notification({
      message: "Il carrello è vuoto",
      gravity: 'error'
    });
    return;
  }

  if(cart.shared){
    const userUid = firebase?.getUserUid();
    if(userUid && userUid != cart.createdBy){
      new Notification({
        message: "Operazione consentita solo al creatore del carrello!",
        gravity: "error"
      })
      return;
    }
  }

  // check for prefill
  // order name
  const orderName = localStorage.getItem('order-name');
  const orderNameElem = document.getElementById('order-name');
  if (orderName && orderNameElem) {
    orderNameElem.value = orderName;
  }

  // order time
  const orderTime = localStorage.getItem('order-time');
  const orderTimeElem = document.getElementById('order-time');
  if (orderTime && orderTimeElem) {
    orderTimeElem.value = orderTime;
  }

  // total price
  let cartSubtotal = 0;
  for (const item of cartItems) {
    cartSubtotal += item.totalPrice;
  }
  const cartSubtotalElem = document.getElementById('order-price');
  if (cartSubtotalElem) cartSubtotalElem.textContent = cartSubtotal.toFixed(2);

  // open dialog
  const previewOrderDialog = document.getElementById('preview-order');
  if (previewOrderDialog) previewOrderDialog.showModal();

  // order message
  generateOrderMessage();
}

/**
 * Generate the order string to display on order confirmation window
 */
function generateOrderMessage() {

  const cart = getCart();
  const cartItems = getCartItems();

  const orderTime = document.getElementById('order-time');
  const orderName = document.getElementById('order-name');
  let greetings = 'Buongiorno';

  if ((new Date()).getHours() > 14) {
    greetings = 'Buonasera';
  }

  let simple_order_string = '';

  for (const [index, item] of Object.entries(cartItems)) {
    let single_order = ''
    single_order += `${Number(index) + 1}) ${item.dimension.toUpperCase()}: `;

    for (const elements of Object.values(item.ingredients)) {
      for (const element of elements) {
        single_order += element.id.replaceAll("-", " ").replaceAll("--", "'") + (element.quantity > 1 ? " x" + element.quantity : "") + ", ";
      }
    }
    // rimozione ultima virgola
    single_order = single_order.slice(0, single_order.length - 2);

    single_order += '\n\r';

    simple_order_string += single_order;
  }

  const complete_order_string =
    `${greetings},
vorrei ordinare ${getCartItems().length > 1 ? getCartItems().length : "una"} poke da asporto per le ${orderTime.value}${orderName.value ? " a nome: " + orderName.value : ""}.

${simple_order_string}`;

  const orderMessageElem = document.getElementById('order-preview');
  if (orderMessageElem) {
    orderMessageElem.value = complete_order_string;
    orderMessageElem.style.height = orderMessageElem.scrollHeight + 3 + 'px';
  }
}

function setOrderName(elem) {
  generateOrderMessage()
  if (!elem) return;

  localStorage.setItem('order-name', elem.value);
}

function setOrderTime(elem) {
  generateOrderMessage()
  if (!elem || !elem.value) return;

  localStorage.setItem('order-time', elem.value);
}


/**
 * Redirect to application with preloaded order message
 */
function sendOrder() {
  // last checks

  // time must not be empty
  const time = document.getElementById('order-time');
  if (!time.value) {
    // does not work since it's fired from a modal dialog in the top layer
    new Notification({
      message: "Scegli un orario prima di procedere!",
      gravity: 'error',
      targetId: 'toast-container-order'
    });
    return
  }

  // get order string (can have been modified by user after generation)
  const order_preview = document.getElementById('order-preview');
  let order_string = ''
  if (order_preview) {
    order_string = order_preview.value
  } else {
    // ERROR
    new Notification({
      message: "ops, qualcosa è andato storto.\nProva più tardi.!",
      gravity: 'error'
    });
    return
  };

  // open wa to send message
  window.open(`https://wa.me/${config.numero_telefono}/?text=${encodeURIComponent(order_string)}`);

  // ask if order has been completed to clear the cart
  //clearCart(true);


  closeDialog('preview-order');
  closePage('cart');
}

/**
 * Removes an item from the cart
 * 
 * @param {String} id - item id on cart 
 */
function removeFromCart(id, canEdit = true, ask = true) {
  let cart = getCart();

  const toBeRemoved = cart.items[id];
  if(!toBeRemoved) return;

  if(!canEdit){
    new Notification({
      message: "Non puoi rimuovere un elemento creato da un altro utente!",
      gravity: 'error'
    })
    return;
  }

  if(ask){
    _confirm(`Confermare l'eliminazione dell'elemento: ${toBeRemoved.name} ?`, () => removeFromCart(id, canEdit, false));
    return;
  }
  
  // if cart is shared but user is not logged =>  unlink and "convert" to normal cart
  if(cart.shared && firebase && firebase.getUserUid()){
    removeItemFromSharedCart(cart.items[id]);
    return;
  } else {
    delete cart.createdBy;
    cart.shared = false;
    cart.id = getRandomId(40);
  } 

  delete cart.items[id];
  saveCart(cart);
}

/**
 * Save cart to localStorage and update cart UI
 * 
 * @param {Array} cart - Items in the cart
 */
function saveCart(cart) {
  // save cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));

  drawCartItems();
}

/**
 * Updates the UI for cart re-inserting all items
 * 
 */
function drawCartItems() {
  const cart = getCart();
  // save ids of open elements
  const openElems = Array.from(document.querySelectorAll('#cart details[open]'));
  let openElemsId = [];
  if (openElems.length > 0) {
    openElemsId = openElems.map(elem => elem.dataset.id)
  }

  // empty cart UI
  const cartElem = document.getElementById('cart-content');
  if (cartElem) cartElem.innerHTML = '';

  // additional header for remote carts
  if(isUserActive() && cart.shared){
    const additionalHeaderElemStr = 
    `<h4 class="w-100 sticky top-0 main-bg flex flex-column just-center align-center padding-1 gap-5">
      <button
        id="unlink-shared-cart" 
        class="button icon icon-only icon-small rapid-action accent-1 fixed left-1"
        title="Scollega carrello condiviso"
        onclick="unlinkSharedCart('${cart.id}')"
      >
        <i class="fa-solid fa-link-slash"></i>
      </button>

      <span id="shared-cart-name" class="w-70">${cart.name}</span>
      <div class="underline text-small text-capitalize pointer" onclick="generatedCartLink('${cart.id}', '${cart.name}')">
      Genera link invito
      </div>

      <button 
        id="remove-shared-cart" 
        class="button icon icon-only icon-small rapid-action accent-1 fixed right-1"
        title="Cancella carrello condiviso"
        onclick="deleteSharedCart('${cart.id}')"
      >
        <i class="fa-solid fa-trash"></i>
      </button>
      
      </h4>`;

    cartElem.append(convertToHTML(additionalHeaderElemStr));

  }

  let cartSubtotal = 0;
  const subtotals = Object.values(PAYMETHODS).reduce((obj, key) => ({...obj, [key]:0}), {'none': 0});

  const cartItems = getCartItems(true)

  for (const item of cartItems) {
    const description = toString(item);
    const isOpen = openElemsId?.includes(item.id);
    const isItemStarrred = isStarred(item.id);
    const canEdit = canEditItem(item);
    const itemName = getName(item);
    
    const paymentMethod = item.paymentMethod;
    subtotals[paymentMethod || 'none'] += item.totalPrice;
    cartSubtotal += item.totalPrice;


    const itemElemStr =
      `<div class="item-container ${canEdit ? '' : 'disabled'}">
          <details data-id="${item.id}" class="details w-100" ${isOpen ? "open" : ""}>
          <summary class="item-title">
            <span class="item-name" title="${itemName.name}">${itemName.fullName}</span>

            <div class="item-short flex align-center just-end min-w-fit">
              <div class='item-price margin-10' title="Prezzo">
                <span>${item.totalPrice.toFixed(2)} €</span>
              </div>

              <!-- <button 
                id="edit-item" 
                class="button icon icon-only icon-small rapid-action"
                title="Modifica" 
                onclick="editItem('${item.id}')"
              > 
              <i class="fa-solid fa-pen"></i>
              </button>-->
              
              <button 
                id="remove-item" 
                class="button icon icon-only icon-small rapid-action accent-1"
                title="Rimuovi dal carrello"
                onclick="removeFromCart('${item.id}', ${canEdit})"
              >
              <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </summary>

          <div class="item-description">${description}</div>

          <!-- <div class='item-price'>
            <div>Prezzo:<span>${item.totalPrice.toFixed(2)}</span>€</div>
          </div> -->

          <div class="item-actions flex">

            <button
              id="edit-item"
              class="button icon icon-only icon-small"
              title="Modifica"
              onclick="editItem('${item.id}', 'cart')"
            >
            <i class="fa-solid fa-pen"></i>
            </button>

            <button 
              id="star-item" 
              class="button icon icon-only icon-small accent-2 ${isItemStarrred ? 'disabled' : ''}"
              title="${isItemStarrred ? 'Elemento già aggiunto ai preferiti' : 'Aggiungi ai preferiti'}"
              onclick="starItemFromCart('${item.id}')"
            >
            <i class="fa-solid fa-star"></i>
            </button>
  
            <button
              id="clone-item" 
              class="button icon icon-only icon-small"
              title="Crea una copia"
              onclick="cloneItem('${item.id}', 'cart')"
            >
            <i class="fa-solid fa-clone"></i>
            </button>

            <button 
              id="remove-item" 
              class="button icon icon-only icon-small accent-1"
              title="Rimuovi dal carrello"
              onclick="removeFromCart('${item.id}', ${canEdit})"
            >
            <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          </details>
        </div>
        `;

    const itemElem = convertToHTML(itemElemStr);
    cartElem.append(itemElem);
  }

  for(const st in subtotals){
    const stElem = document.getElementById(`subtotal-type-${st}`);
    if(stElem){
      const _value = subtotals[st].toFixed(2);
      if(_value > 0) {
        stElem.textContent = _value;
      } else {
        stElem.textContent = '';
      }
    }
  }


  const itemsNumber = cartItems.length;
  // update cart count
  const menuElem = document.getElementById('cart-menu');
  if (menuElem) menuElem.dataset.cartcount = itemsNumber > 0 ?  itemsNumber : '';

  const headerElem = document.getElementById('cart-count');
  if (headerElem) headerElem.textContent =  itemsNumber;

  // enable / disable preview button
  const preview_btn = document.getElementById('btn-preview-order');
  if ( itemsNumber == 0) {
    preview_btn.classList.add('disabled');
  } else {
    preview_btn.classList.remove('disabled');
  }

  // aggiorna il totale UI
  const cartSubtotalElem = document.querySelector('#cart-price span');
  if (cartSubtotalElem) cartSubtotalElem.textContent = cartSubtotal.toFixed(2);
}


function getCartItems(ordered = false){
  const items = Object.values(getCart().items || {});
  
  // ordinamento alfanumerico
  if(ordered){
    items.sort((A, B) => {
      return A.name > B.name ? 1 : -1;
    });
  }

  return items;
}


function canEditItem(item){
  if(!firebase){
    return true;
  }

  const cart = getCart();
  if(!cart.shared){
    return true;
  }

  if(!item.createdBy){
    return true;
  }

  const userUid = firebase.getUserUid();
  if(!userUid){
    // user not logged
    return true;
  }
  
  if(userUid == item.createdBy || userUid == cart.createdBy) {
    return true;
  }

  return false;
}