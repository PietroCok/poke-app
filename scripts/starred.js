/**
 * Return starred items array form localStorage
 */
function getStarred(){
    const starredItems = JSON.parse(localStorage.getItem('starred'));
    return starredItems || [];
}

/**
 * Update starred item in localStorage
 */
function setStarred(items){
    localStorage.setItem('starred', JSON.stringify(items));
}

/**
 * Show starred items list
 */
function openStarredItems(){
    const starredItems = getStarred();

    for(const item of starredItems){
        // TODO HTML costruction
    }

    // show layer
    const starred = document.getElementById('starred');
    if(starred) starred.classList.remove('hidden');
}

/**
 * Hide starred items list
 */
function closeStarred(){
    const starred = document.getElementById('starred');
    if(starred) starred.classList.add('hidden');
}

/**
 * Load item from starred list into cart
 */
function loadStarredIntoCart(id){
    // TODO

    closeStarred();
}

/**
 * Add item into starred list
 */
function starItem(id){
    const starredItems = getStarred();
    if(isStarred(id)) return;

    // for now is support only starring an item from cart
    const cart = getCart();
    const item = cart.find(item => item.id == id);
    starredItems.push(item);

    setStarred(starredItems);

    updateCart();
}

/**
 * Checks if item is already starred
 */
function isStarred(id){
    const starredItems = getStarred();
    const alreadyStarred = starredItems.find(item => item.id == id);
    if(alreadyStarred) return true;
    return false;
}

/**
 * Remove item from starred list
 */
function removeStar(id){
    let starredItems = getStarred();

    starredItems = starredItems.filter(item => item.id != id);

    setStarred(starredItems);
}
