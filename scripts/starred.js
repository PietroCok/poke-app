/**
 * Return starred items array form localStorage
 */
function getStarred() {
  const starredItems = JSON.parse(localStorage.getItem('starred'));
  return starredItems || [];
}

/**
 * Update starred item in localStorage
 */
function setStarred(items) {
  localStorage.setItem('starred', JSON.stringify(items));

  drawStarredItems();
  drawCartItems();
}

/**
 * Show starred items list
 */
function openStarredItems() {
  drawStarredItems();
  // show layer
  const starred = document.getElementById('starred');
  if (starred) starred.classList.remove('hidden');

  closeMenu();
}

/**
 * Hide starred items list
*/
function closeStarred() {
  const starred = document.getElementById('starred');
  if (starred) starred.classList.add('hidden');
}

/**
 * Load item from starred list into cart
*/
function loadStarredIntoCart(id) {
  // TODO

  closeStarred();

  drawStarredItems();
}

/**
 * Add item into starred (from cart)
*/
function starItemFromCart(id) {
  const starredItems = getStarred();
  if (isStarred(id)) return;

  // for now is support only starring an item from cart
  const cart = getCart();
  const item = cart.find(item => item.id == id);
  starredItems.push(item);

  setStarred(starredItems);

  drawCartItems();
}

/**
 * Add item into starred (from item)
 */
function starItem(item) {
  if (!item) return;

  const starredItems = getStarred();
  if (isStarred(item.id)) return;

  starredItems.push(item);

  setStarred(starredItems);
  drawStarredItems();
}

/**
 * Update item in starred
 */
function updateStarredItem(item) {
  if (!item) return;

  if (!isStarred(item.id)) return;

  const starred = getStarred();

  // update id to avoid duplicate ids between cart and starred if one of them is edited
  item.id = getRandomId();

  // update element in starred
  const index = starred.findIndex(_item => _item.id == item.id);
  starred.splice(index, 1, item);

  setStarred(starred);
}

/**
 * Checks if item is already starred
*/
function isStarred(id) {
  const starredItems = getStarred();
  const alreadyStarred = starredItems.find(item => item.id == id);
  if (alreadyStarred) return true;
  return false;
}

/**
 * Remove item from starred list
*/
function removeStarred(id) {
  let starredItems = getStarred();

  starredItems = starredItems.filter(item => item.id != id);

  setStarred(starredItems);

  drawStarredItems();
  drawCartItems();
}


/**
 * Create and add document structure for starred items
 */
function drawStarredItems() {
  const starredItems = getStarred();
  const starredItemContainer = document.getElementById('starred-content');

  const openElems = Array.from(document.querySelectorAll('#starred details[open]'));
  let openElemsId = [];
  if (openElems.length > 0) {
    openElemsId = openElems.map(elem => elem.dataset.id)
  }

  // clear previous elems
  if (!starredItemContainer) return;
  starredItemContainer.innerHTML = '';

  for (const item of starredItems) {
    const isOpen = openElemsId?.includes(item.id);
    const isItemCarted = isCarted(item.id);
    const description = toString(item);

    // TODO HTML costruction
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
                  id="star-item" 
                  class="ibutton icon icon-only icon-small accent-2 rapid-action ${isItemCarted ? 'disabled' : ''}"
                  title="${isItemCarted ? 'Elemento già nel carrello' : 'Aggiungi al carrello'}"
                  onclick="addToCartFromStarred('${item.id}')"
                >
                  <i class="fa-solid fa-cart-shopping"></i>
                </button> -->

                <button 
                  id="remove-item" 
                  class="button icon icon-only icon-small accent-1 rapid-action"
                  title="Rimuovi dal carrello"
                  onclick="removeStarred('${item.id}')"
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
                onclick="editItem('${item.id}', 'starred')"
              >
                <i class="fa-solid fa-pen"></i>
              </button>

              <button 
                id="star-item" 
                class="button icon icon-only icon-small accent-2 ${isItemCarted ? 'disabled' : ''}"
                title="${isItemCarted ? 'Elemento già nel carrello' : 'Aggiungi al carrello'}"
                onclick="addToCartFromStarred('${item.id}')"
              >
                <i class="fa-solid fa-cart-shopping"></i>
              </button>

              <button
                id="clone-item" 
                class="button icon icon-only icon-small"
                title="Crea una copia"
                onclick="cloneItem('${item.id}', 'starred')"
              >
                <i class="fa-solid fa-clone"></i>
              </button>

              <button 
                id="remove-item" 
                class="button icon icon-only icon-small accent-1"
                title="Rimuovi dai preferiti"
                onclick="removeStarred('${item.id}')"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </details>
        </div>
        `;

    const itemElem = convertToHTML(itemElemStr)
    starredItemContainer.append(itemElem);
  }
}



