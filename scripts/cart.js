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
 * Closes cart page
 */
function closeCart() {
  const cartElem = document.getElementById('cart');
  if (cartElem) cartElem.classList.add('hidden');
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
  if (!cart || !cart.items) {
    cart = {
      id: getRandomId(),
      items: []
    };
  }
  return cart;
}

/**
 * Loads the cart from localStorage
 */
function loadCart() {
  drawCartItems();
}

/**
 * Removes all items from cart and deletes it from localStorage
 */
function clearCart(skipConfirm = false) {
  if(!skipConfirm){
    _confirm("Svuotare il carrello?\nL'operazione non è reversibile", () => clearCart(true));
    return;
  }

  let cart = {
    id: getRandomId(),
    items: []
  };
  saveCart(cart);
  drawCartItems();
}


/**
 * Checks if item is already in the cart
*/
function isCarted(id) {
  const cart = getCart();
  const alreadycarted = cart.items?.find(item => item.id == id);
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
function addToCart(item, allowDuplicate = false) {
  if (!item) return;

  let poke = structuredClone(item);
  const cart = getCart();

  if (!poke.id || allowDuplicate) {
    // insert into cart
    poke.id = getRandomId();
    cart.items.push(poke);
    new Notification({
      message: "Salvato nel carrello!",
      displayTime: .8
    });
  } else {
    const index = cart.items.findIndex(_item => _item.id == poke.id);
    if (index < 0) {
      // add new item
      cart.items.push(poke);
    } else {
      // update intem in cart
      poke.id = getRandomId();
      cart.items.splice(index, 1, poke);
    }
    new Notification({
      message: "Aggiornato nel carrello!",
      displayTime: .8
    });
  }

  clearConfigurator();

  saveCart(cart);
}

/**
 * Opens preview order dialog
 */
function showOrderPreview() {
  // check if at least one item in cart
  const cart = getCart();

  if (cart.items.length == 0) {
    new Notification({
      message: "Il carrello è vuoto",
      gravity: 'error'
    });
    return;
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
  for (const item of cart.items) {
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
  const orderTime = document.getElementById('order-time');
  const orderName = document.getElementById('order-name');

  let simple_order_string = '';

  for (const [index, item] of Object.entries(cart.items)) {
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
    `Buongiorno,
vorrei ordinare ${cart.items.length > 1 ? cart.items.length : "una"} poke da asporto per le ${orderTime.value}${orderName.value ? " a nome: " + orderName.value : ""}.

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

  clearCart(true);
  closeDialog('preview-order');
  closeCart();
}

/**
 * Removes an item from the cart
 * 
 * @param {String} id - item id on cart 
 */
function removeFromCart(id, ask = true) {
  let cart = getCart();

  if(ask){
    const toBeRemoved = cart.items.find(item => item.id == id);
    if(!toBeRemoved) return;
  
    _confirm(`Confermare l'eliminazione dell'elemento: ${toBeRemoved.name} ?`, () => removeFromCart(id, false));
    return;
  }
  
  cart.items = cart.items.filter(item => item.id != id);
  
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
  if(checkLogin() && cart.shared){
    const additionalHeaderElemStr = 
    `<h4 class="w-100 sticky top-0 main-bg flex flex-column">
      Carrello condiviso
      <span id="shared-cart-name" class="weight-normal margin-10">${cart.name}</span>
    </h4>`;

    cartElem.append(convertToHTML(additionalHeaderElemStr));
  }

  let cartSubtotal = 0;

  for (const item of cart.items) {
    const description = toString(item);
    const isOpen = openElemsId?.includes(item.id);
    cartSubtotal += item.totalPrice;
    const isItemStarrred = isStarred(item.id);

    const itemElemStr =
      `<div class="item-container">
          <details data-id="${item.id}" class="details w-100" ${isOpen ? "open" : ""}>
          <summary class="item-title">
            <span class="item-name" title="${item.name}">${item.name}</span>

            <div class="item-short flex align-center just-end">
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
                onclick="removeFromCart('${item.id}')"
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
              onclick="removeFromCart('${item.id}')"
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

  // update cart count
  const menuElem = document.getElementById('cart-menu');
  if (menuElem) menuElem.dataset.cartcount = cart.items.length > 0 ? cart.items.length : '';

  const headerElem = document.getElementById('cart-count');
  if (headerElem) headerElem.textContent = cart.items.length;

  // enable / disable preview button
  const preview_btn = document.getElementById('btn-preview-order');
  if (cart.items.length == 0) {
    preview_btn.classList.add('disabled');
  } else {
    preview_btn.classList.remove('disabled');
  }

  // aggiorna il totale UI
  const cartSubtotalElem = document.querySelector('#cart-price span');
  if (cartSubtotalElem) cartSubtotalElem.textContent = cartSubtotal.toFixed(2);
}
