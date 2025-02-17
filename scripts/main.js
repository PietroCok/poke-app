let config;

let selected = {
  dimension: "regular",
  ingredients: {},
  time: ''
};

let fullOrder = '';
let compactOrder = '';


function fillHtml() {

  setTitle(config);

  // inserisce scelta su dimensioni
  setDimensions(config);

  // inserisce opzioni per ogni tipologia
  setingredientsGroups(config);
}

function setTitle(config) {
  const elem =
    `<div class="title flex flex-center flex-column accent-2 margin-08-0">
    <h1 class="text-center">${config.titolo}</h1>
    <div class="flex flex-center flex-column">
      <div class="text-center text-small margin-5-0">${config.sotto_titolo}</div>
      <div class="text-center text-small margin-5-0">${config.sotto_titolo_2}</div>
    </div>
  </div>
  `;

  // Non necessario finchè non vengono valorizzati gli appositi campi nel file di configurazione
  document.getElementById('main').insertBefore(convertToHTML(elem), document.getElementById('subtitle'))
}

function setDimensions(config) {
  const section = document.getElementById("dimensione");
  let isFirst = true;

  for (const [name, values] of Object.entries(config.dimensioni)) {
    const limits = Object.entries(values.limiti).map(x => x[1] + " " + x[0]);

    const elemLimits = document.createElement("div");
    elemLimits.classList.add("limits");
    for (const limit of limits) {
      const _elem =
        `<span class="${name}-${limit.split(" ")[1]}">${limit}</span>`;

      elemLimits.append(convertToHTML(_elem));
    }

    const elem =
      `<div class="flex flex-center flex-column dimension">
      <label class="label text-uppercase" for="dim-${name}"><input id="dim-${name}" type="radio" name="dim" ${isFirst ? "checked" : ""}>${name}</label>
      <label for="dim-${name}" class="limits">
        ${elemLimits.outerHTML}
      </label>

      <label for="dim-${name}" class="flex flex-center">
        <div class="price-label">${values.prezzo.toFixed(2).toLocaleString('it-IT')} €</div>
      </label>
    </div>`;

    isFirst = false;
    const _elem = convertToHTML(elem);
    _elem.onclick = checkSelection;
    section.append(_elem);
  }
}

function setingredientsGroups(config) {
  const main_section = document.getElementById("ingredients");
  const groups = config.gruppi;

  for (const [name, group] of Object.entries(groups)) {

    // contenitore del gruppo
    const section =
      `<section class="${name}">
      <div class="section-title-container flex">
        <span></span>
        <h3 id="${name}" class="group-title">${name}</h3>
        <span class="${name}-limits">
          <span id="${name}-limit-current">0</span> / <span id="${name}-limit-max">-</span>
          <span class="extra-price">
            +<span id="extra-price-${name}"></span>€
          </span>
        </span>


        <h4 class="w-100 extra-label">${group.extras}</h4>
      </div>

      <div class="options flex flex-wrap gap-1 padding-1-0">

      </div>
    </section>
    `

    const sectionElem = convertToHTML(section);

    // opzioni del gruppo
    for (const option of group.opzioni) {
      const id = option.name.replaceAll(" ", "-").replaceAll("'", "--");
      const _opt =
        `<div class="option-container">
        <label for="${id}" class="option-name"> ${option.name} </label>
        <input type="checkbox" id="${id}" data-group="${name}">
        <span class="button extra-btn icon" title="Aggiungi extra" data-group="${name}" data-option="${id}" onclick="addExtra(this)">
          <i class="fa-solid fa-plus hover"></i>
        </span>
      </div>
      `

      const _optElem = convertToHTML(_opt);
      sectionElem.querySelector(".options").append(_optElem);

      _optElem.onclick = checkSelection;
    }

    main_section.append(sectionElem)
  }
}

// esegue controlli al click di ogni elemento delle sezioni
// in particolare verifica che non venga superato il limite di elementi in base alla dimensione scelta
function checkSelection(evt) {
  const selectedElem = evt.target;
  const checkType = selectedElem.getAttribute("type");

  switch (checkType) {
    case 'checkbox':
      const group = selectedElem.dataset.group;

      if (selectedElem.checked) {
        addingredient(group, selectedElem.id)
      } else {
        removeIngredient(group, selectedElem.id);
      }
      break;

    case 'radio':
      selected.dimension = selectedElem.id.split("-")[1];
      recalculateLimits();
      break;
  }

  // save item from configurator on localStorage
  localStorage.setItem("item", JSON.stringify(selected));
}

function addExtra(elem) {
  const group = elem.dataset.group;
  const option = elem.dataset.option;

  addingredient(group, option)
}

function addingredient(group, option, quantity = 1) {
  if (!group) return;

  if (!selected.ingredients[group]) {
    selected.ingredients[group] = [];
  }

  const ingredient = selected.ingredients[group].find(x => x.id == option)
  if (ingredient) {
    ingredient.quantity += 1;
    quantity = ingredient.quantity;
  } else {
    selected.ingredients[group].push({
      id: option,
      quantity: quantity
    });
  }

  if (quantity > 1) {
    document.querySelector(".option-container:has(#" + option + ")").setAttribute("data-extra", quantity)
  }

  recalculateLimits();
}

function removeIngredient(group, option) {
  if (typeof option != "string") {
    option = option.id || "";
  }

  selected.ingredients[group] = selected.ingredients[group].filter(x => x.id != option);

  document.getElementById(option).checked = false;
  document.querySelector(".option-container:has(#" + option + ")").removeAttribute("data-extra");

  recalculateLimits();
}


/**
 * Loads an item in the configurator
 * 
 * @param {String} id 
 */
function editItem(id, from = '') {
  if (!id) return;

  let item;
  switch (from) {
    case 'cart':
      const cart = getCart();
      item = cart.find(item => item.id == id);
      if (!item) return;
      // save from where the item is edited
      if (from) item.from = from;

      try {
        loadIntoConfigurator(item);
      } catch (error) {
        alert(error);
        return;
      }

      closeCart();
      break;
    case 'starred':
      const starred = getStarred();
      item = starred.find(item => item.id == id);
      if (!item) return;
      // save from where the item is edited
      if (from) item.from = from;

      try {
        loadIntoConfigurator(item);
      } catch (error) {
        alert(error);
        return;
      }

      closeCart();
      closeStarred();
      break;
  }


}

/**
 * Carica un ordine (da localstorage)
 */
function loadIntoConfigurator(_item = null) {
  let item = _item;

  if (!_item) {
    try {
      item = JSON.parse(localStorage.getItem("item"));
    } catch (error) {
      console.error("Failed to load item from localStorage")
      return;
    }
    if (!item) return;
  }

  clearConfigurator();

  document.getElementById("dim-" + item.dimension).checked = true;

  // seleziono gli ingredienti salvati
  for (const group of Object.keys(item.ingredients)) {
    for (const ingredient of item.ingredients[group]) {
      addingredient(group, ingredient.id, ingredient.quantity, false);
      document.getElementById(ingredient.id).checked = true;
    }
  }

  selected = JSON.parse(JSON.stringify(item));
  localStorage.setItem("item", JSON.stringify(selected));
}

/**
 * Opens dialog to enter name of item
 */
function askItemName() {
  if (Object.keys(selected.ingredients).length == 0) {
    alert('Non è possibile salvare un elemento vuoto!');
    return;
  }

  if (selected.name) {
    const dialog_name = document.querySelector('#add-item-name input');
    if (dialog_name) dialog_name.value = selected.name;
  }

  const dialog_addItemName = document.getElementById('add-item-name');
  if (dialog_addItemName) dialog_addItemName.showModal();
}

/**
 * Save item from configurator
 */
function saveItem() {
  // get loaded item in configurator
  const item = structuredClone(selected);

  const dialog_addItemName = document.getElementById("add-item-name");
  const dialog_input = document.querySelector('#add-item-name input');
  if (dialog_input) {
    let name = dialog_input.value;
    if (!name) name = 'Senza nome'
    item.name = name;

    dialog_input.value = '';
    dialog_addItemName.close();
  }

  // check where to save item
  // default to cart
  switch (item.from) {
    case 'starred':
      updateStarredItem(item);
      break;

    case 'cart':
    default:
      addToCart(item);
  }
}

/**
 * Clone and add an item to the cart
 * 
 * @param {String} id - id of item to clone 
 */
function cloneItem(id, from) {
  if (!id || !from) return;

  let item;
  let copy;
  switch (from) {
    case 'starred':
      const starred = getStarred();
      item = starred.find(item => item.id == id);
      copy = structuredClone(item);
      copy.id = getRandomId();
      starItem(copy)
      break;

    case 'cart':
      const cart = getCart();
      item = cart.find(item => item.id == id);
      copy = structuredClone(item);
      copy.id = getRandomId();
      addToCart(copy, true);

  }
}

function sortIngredientGroups(A, B) {
  return config.gruppi[A].ordine - config.gruppi[B].ordine;
}

function clearConfigurator() {
  // rimuove tutti i checks
  const _selected = selected.ingredients;
  for (const group of Object.keys(_selected)) {
    for (const ingredient of _selected[group]) {
      removeIngredient(group, ingredient, false);
    }
  }

  const _dim = document.querySelector("input[type='radio']:checked").id.split("-")[1];
  selected = {
    dimension: _dim ?? "regular",
    time: '',
    ingredients: {},
  }

  localStorage.setItem("item", JSON.stringify(selected));
}

// Ricalcola i limiti per tutti gli ingredienti selezionati
function recalculateLimits() {
  const _selected = selected.ingredients;
  const extra = {};

  // reset
  for (const [group, max] of Object.entries(config.dimensioni[selected.dimension].limiti)) {
    updateLimits(group, 0, max);
  }

  for (const group of Object.keys(_selected)) {
    let currentSelection = 0;

    for (const ingredient of _selected[group]) {
      currentSelection += ingredient.quantity;
    }

    let maxSelection = config.dimensioni[selected.dimension].limiti[group]

    updateLimits(group, currentSelection, maxSelection);

    if (currentSelection > maxSelection) {
      extra[group] = { current: currentSelection, max: maxSelection };
    }
  }

  updatePrice(extra);
}

function updatePrice(extra) {
  // alcuni gruppi di ingredienti sono più di quelli inclusi nella dimensione scelta
  // calcolo costo extra
  const basePrice = config.dimensioni[selected.dimension].prezzo;
  let extraPrice = 0;

  for (const group of Object.keys(config.gruppi)) {
    let groupExtraPrice = 0;
    if (extra[group]) {
      const outOfLimits = extra[group].current - extra[group].max;

      // recupera elementi del gruppo
      const selectedInGroup = JSON.parse(JSON.stringify(selected.ingredients[group]));

      // ordine elementi del gruppo per prezzo
      selectedInGroup.sort(sortIngredientByPrice);

      // somma il prezzo degli n meno costosi
      let counter = outOfLimits;
      while (counter > 0) {
        selectedInGroup[0].quantity--;
        groupExtraPrice += getPrice(selectedInGroup[0].id);

        if (selectedInGroup[0].quantity <= 0) {
          selectedInGroup.splice(0, 1)
        }
        counter--;
      }

      extraPrice += groupExtraPrice;

    }

    // prezzo extra per gruppo di ingredienti
    const elem = document.getElementById("extra-price-" + group);
    if (elem) {
      if (groupExtraPrice > 0) {
        elem.textContent = groupExtraPrice.toFixed(2);
      } else {
        elem.textContent = '';
      }
    }
  }

  // prezzo totale della bowl
  const totalPrice = basePrice + extraPrice;
  const elem = document.querySelector('#order-total-extra-price span');
  if (elem) {
    elem.textContent = totalPrice.toFixed(2);
    elem.title = `${basePrice.toFixed(2)}€ (base) + ${extraPrice.toFixed(2)}€ (extra)`;
  }

  selected.totalPrice = totalPrice;
  selected.basePrice = basePrice;
  selected.extraPrice = extraPrice;
}

function sortIngredientByPrice(A, B) {
  // recupera prezzi degli ingredienti da confrontare
  return getPrice(A.id) - getPrice(B.id);
}


function getPrice(ingredient) {
  for (const [group, ingredients] of Object.entries(config.gruppi)) {
    const _ingredient = ingredients.opzioni.find(i => i.name.replaceAll(" ", "-").replaceAll("'", "--") == ingredient)
    if (_ingredient) {
      return _ingredient.prezzo;
    }
  }

  return 0;
}


function updateLimits(group, current, max) {
  document.getElementById(group + "-limit-current").textContent = current;
  document.getElementById(group + "-limit-max").textContent = max;

  if (current > max) {
    document.getElementById(group + "-limit-current").classList.add("over-limit")
  } else {
    document.getElementById(group + "-limit-current").classList.remove("over-limit")
  }
}

function handleMenuClick() {
  // get details state
  const parentContainer = document.querySelector('#main-menu-container details');
  if (parentContainer && !parentContainer.open) {
    // close theme menu every time is opened
    loadTheme();
  }
}

function closeMenu() {
  const elem = document.querySelector('#main-menu-container details');
  if (elem) elem.open = false;
}

function addActions() {
  // dialogs comfirm with enter
  const dialog_name = document.getElementById('add-item-name');
  if (dialog_name) dialog_name.addEventListener('keypress', (evt) => {
    if (evt.key == 'Enter') saveItem();
  })

  const dialog_preview = document.getElementById('preview-order');
  if (dialog_preview) dialog_preview.addEventListener('keypress', (evt) => {
    if (evt.key == 'Enter') sendOrder();
  })

  // visualizza sempre una singola icona per ogni sottomenu all'apertura del menu
  const main_menu = document.getElementById('main-menu');
  if (main_menu) main_menu.onclick = handleMenuClick;

  // close menu if click outside of it
  const main_menu_container = document.getElementById('main-menu-container');
  document.addEventListener('touchstart', (evt) => handleCloseMenu(evt));
  document.addEventListener('mousedown', (evt) => handleCloseMenu(evt));
  function handleCloseMenu(evt) {
    if (!main_menu_container.contains(evt.target)) {
      closeMenu();
    }
  }

  // close dialog if click outsite of it (requires a div covering the entire dialog area)
  const dialogs = document.getElementsByTagName('dialog');
  for (const dialog of dialogs) {
    dialog.onclick = (evt) => {
      if (evt.target.tagName == 'DIALOG') {
        const dialog_id = evt.target.id;
        closeDialog(dialog_id);
      }
    };
  }
}


async function setUp() {
  await loadConfig();

  fillHtml();

  addActions();

  loadIntoConfigurator();

  recalculateLimits();

  loadCart();
}

setUp();



