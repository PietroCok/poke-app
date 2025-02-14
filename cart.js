/**
 * Opens cart page
 */
function openCart() {
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
    let cart = JSON.parse(localStorage.getItem('poke-cart'));
    if (!cart) {
        cart = [];
    }
    return cart;
}

/**
 * Loads the cart from localStorage
 */
function loadCart() {
    const cart = getCart();

    updateCart(cart);
}

/**
 * Removes all items from cart and deletes it from localStorage
 */
function clearCart() {
    if (confirm("Svuotare il carrello?\nL'operazione non è reversibile")) {
        let cart = [];
        saveCart(cart);
    }
}

/**
 * Add selected or current item to cart, then saves it to localStorage
 * 
 * @param {Object} [item={}] 
 */
function addToCart(item = {}, allowDuplicate = false) {
    let poke = JSON.parse(JSON.stringify(item));

    // if no valid object, add to cart current selected poke
    if (!poke?.dimension) {
        poke = JSON.parse(JSON.stringify(selected));
        // try to get the item name from dialog
        const dialog_addItemName = document.getElementById("add-item-name");
        const dialog_input = document.querySelector('#add-item-name input');
        if (dialog_input) {
            let name = dialog_input.value;
            if (!name) name = 'Senza nome'
            poke.name = name;

            dialog_input.value = '';
            dialog_addItemName.close();
        }
    }

    const cart = getCart();

    if (!poke.id || allowDuplicate) {
        // insert into cart
        poke.id = Math.random().toString(36).slice(2);
        cart.push(poke);
    } else {
        // update intem in cart
        const index = cart.findIndex(_item => _item.id == poke.id);
        cart.splice(index, 1, poke);
    }

    clearConfigurator();
    
    saveCart(cart);
}

/**
 * Opens dialog to enter name of poke
 */
function askItemName() {
    if (Object.keys(selected.ingredients).length == 0) {
        alert('Non è possibile aggiungere una poke vuota al carrello!');
        return;
    }

    if(selected.name){
        const dialog_name = document.querySelector('#add-item-name input');
        if(dialog_name) dialog_name.value = selected.name;
    }

    const dialog_addItemName = document.getElementById('add-item-name');
    if (dialog_addItemName) dialog_addItemName.showModal();
}

/**
 * Opens preview order dialog
 */
function showOrderPreview(){
    // check if at least one item in cart
    const cart = getCart();

    if(cart.length == 0){
        return;
    }

    // check for prefill
    // order name
    const orderName = localStorage.getItem('order-name');
    const orderNameElem = document.getElementById('order-name');
    if(orderName && orderNameElem){
        orderNameElem.value = orderName;
    }

    // order time
    const orderTime = localStorage.getItem('order-time');
    const orderTimeElem = document.getElementById('order-time');
    if(orderTime && orderTimeElem){
        orderTimeElem.value = orderTime;
    }

    // total price
    let cartSubtotal = 0;
    for(const item of cart){
        cartSubtotal += item.totalPrice;
    }
    const cartSubtotalElem = document.querySelector('#order-price');
    if(cartSubtotalElem) cartSubtotalElem.textContent = cartSubtotal.toFixed(2);
    
    // open dialog
    const previewOrderDialog = document.getElementById('preview-order');
    if(previewOrderDialog) previewOrderDialog.showModal();    

    // order message
    generateOrderMessage();
}

/**
 * Generate the order string to display on order confirmation window
 */
function generateOrderMessage(){

    const cart = getCart();
    const orderTime = document.getElementById('order-time');
    const orderName = document.getElementById('order-name');

    let simple_order_string = '';

    for(const [index, item] of Object.entries(cart)){
        let single_order = ''
        single_order += `${Number(index)+1}) ${item.dimension.toUpperCase()}: `;
        
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
vorrei ordinare ${cart.length > 1 ? cart.length : "una"} poke da asporto per le ${orderTime.value}${orderName.value ?" a nome: " + orderName.value : ""}.

${simple_order_string}`;

    const orderMessageElem = document.getElementById('order-preview');
    if(orderMessageElem) {
        orderMessageElem.value = complete_order_string;
        orderMessageElem.style.height = orderMessageElem.scrollHeight + 3 + 'px';
    }
}

function setOrderName(elem){
    generateOrderMessage()
    if(!elem) return;

    localStorage.setItem('order-name', elem.value);
}

function setOrderTime(elem){
    generateOrderMessage()
    if(!elem || !elem.value) return;

    localStorage.setItem('order-time', elem.value);
}


/**
 * Redirect to application with preloaded order message
 */
function sendOrder(){
    // last checks

    // time must not be empty
    const time = document.getElementById('order-time');
    if(!time.value){
        // ERROR
        alert("Scegli un orario prima procedere con l'ordine!");
        return
    }

    // get order string (can have been modified by user after generation)
    const order_preview = document.getElementById('order-preview');
    let order_string = ''
    if(order_preview) {
        order_string = order_preview.value
    } else {
        // ERROR
        alert("ops, qualcosa è andato storto.\nProva più tardi.")
        return
    };

    // open wa to send message
    window.open(`https://wa.me/${config.numero_telefono}/?text=${encodeURIComponent(order_string)}`);
}

/**
 * Removes an item from the cart
 * 
 * @param {String} id - item id on cart 
 */
function removeFromCart(id) {
    let cart = getCart();

    cart = cart.filter(item => item.id != id);

    saveCart(cart);
}

/**
 * Clone and add an item to the cart
 * 
 * @param {String} id - id of item to clone 
 */
function cloneItem(id) {
    const cart = getCart();

    const item = cart.find(item => item.id == id);

    const copied_item = JSON.parse(JSON.stringify(item));
    copied_item.id = Math.random().toString(36).slice(2);

    addToCart(copied_item, true);
}


/**
 * Add an item to starred items
 * 
 * @param {String} id 
 */
function starItem(id) {
    // TODO
}

/**
 * Loads an item in the configurator
 * 
 * @param {String} id 
 */
function editItem(id) {
    if(!id) return;

    const cart = getCart();

    const item = cart.find(item => item.id == id);
    if(!item) return;

    try {
        loadIntoConfigurator(item);
    } catch (error) {
        alert(error);
        return;     
    }

    closeCart();
}

/**
 * Save cart to localStorage and update cart UI
 * 
 * @param {Array} cart - Items in the cart
 */
function saveCart(cart, update = true) {
    // save cart to localStorage
    localStorage.setItem('poke-cart', JSON.stringify(cart));

    if (update) updateCart(cart);
}

/**
 * Updates the UI for cart re-inserting all items
 * 
 * @param {Object} cart - cart with items to show
 */
function updateCart(cart) {
    // save ids of open elements
    const openElems = Array.from(document.querySelectorAll('details[open]'));
    let openElemsId = [];
    if (openElems.length > 0) {
        openElemsId = openElems.map(elem => elem.dataset.id)
    }

    // empty cart UI
    const cartElem = document.getElementById('cart-content');
    if (cartElem) cartElem.innerHTML = '';

    let cartSubtotal = 0;

    for (const item of cart) {
        const description = toString(item);
        const isOpen = openElemsId?.includes(item.id);
        cartSubtotal += item.totalPrice;

        const itemElemStr =
            `<div class="item-container">
            <details data-id="${item.id}" ${isOpen ? "open" : ""}>
            <summary>
                <span class="item-name">${item.name}</span>

                <div>
                    <div class='item-price'>
                        <span>${item.totalPrice.toFixed(2)} €</span>
                    </div>
                    <button 
                        id="edit-item" 
                        class="icon-button icon-color"
                        title="Modifica" 
                        onclick="editItem('${item.id}')"
                    >
                    <i class="fa-solid fa-pen"></i>
                    </button>
                    <button 
                        id="remove-item" 
                        class="icon-button icon-color-bad"
                        title="Rimuovi dal carrello"
                        onclick="removeFromCart('${item.id}')"
                    >
                    <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </summary>

            <div class="item-description">${description}</div>

            <div class='item-price'>
                <div>Prezzo:<span>${item.totalPrice.toFixed(2)}</span>€</div>
            </div>

            <div class="item-actions">

                <button 
                    id="edit-item" 
                    class="icon-button"
                    title="Modifica"
                    onclick="editItem('${item.id}')"
                >
                <i class="fa-solid fa-pen"></i>
                </button>
    
                <button
                    id="clone-item" 
                    class="icon-button"
                    title="Crea una copia"
                    onclick="cloneItem('${item.id}')"
                >
                <i class="fa-solid fa-clone"></i>
                </button>
    
                <button 
                    id="star-item" 
                    class="icon-button"
                    title="Aggiungi ai preferiti"
                    onclick="starItem('${item.id}')"
                >
                <i class="fa-solid fa-star"></i>
                </button>
                
                <button 
                    id="remove-item" 
                    class="icon-button"
                    title="Rimuovi dal carrello"
                    onclick="removeFromCart('${item.id}')"
                >
                <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            </details>
        </div>
        `;

        // update cart count
        const menuElem = document.getElementById('cart-menu');
        if(menuElem) menuElem.dataset.cartcount = cart.length > 0 ? cart.length : '';

        const headerElem = document.getElementById('cart-count');
        if(headerElem) headerElem.textContent = `( ${cart.length} )`;

        const itemElem = convertToHTML(itemElemStr);
        cartElem.append(itemElem);
    }

    // aggiorna il totale UI
    const cartSubtotalElem = document.querySelector('#cart-price span');
    if(cartSubtotalElem) cartSubtotalElem.textContent = cartSubtotal.toFixed(2);
}
