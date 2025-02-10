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
 * Removes all items from cart and deletes it from localStorage
 */
function clearCart() {
    if (confirm("Svuotare il carrello?\nL'operazione non è reversibile")) {
        // TODO 
    }
}

/**
 * Add selected or current item to cart, then saves it to localStorage
 * 
 * @param {Object} item - item to add to the cart
 */
function addToCart(item = {}) {
    let poke = item;

    // if no valid object, add to cart current selected poke
    if(!item?.dimension){
        poke = selected;
    }

    // checks if the item is valid
    if(Object.keys(selected.ingredients).length == 0){
        alert('Non è possibile aggiungere una poke vuota al carrello!');
        return;
    }

    // get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('poke-cart'));
    if(!cart){
        cart = [];
    }

    // update cart
    cart.push(poke);
    updateCart(cart);

    // save cart to localStorage
    // localStorage.setItem('poke-cart', JSON.stringify(cart));
}

/**
 * Updates the UI for cart re-inserting all items
 * 
 * @param {Object} cart - cart with items to show
 */
function updateCart(cart){
    // TODO
}