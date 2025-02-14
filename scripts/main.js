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
    `<div class="title-wrapper">
    <h1>${config.titolo}</h1>
    <div>
      <div>${config.sotto_titolo}</div>
      <div>${config.sotto_titolo_2}</div>
    </div>
  </div>
  `

  // Not needed until final shipping
  //document.querySelector("header").append(convertToHTML(elem));
}

function setDimensions(config) {
  const section = document.querySelector("#dimensione");
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
      `<div>
        <label class="dim-name" for="dim-${name}"><input id="dim-${name}" type="radio" name="dim" ${isFirst ? "checked" : ""}>${name}</label>
        <label for="dim-${name}" class="w-100">
          ${elemLimits.outerHTML}
        </label>

        <label for="dim-${name}" class="price-container">
          <div class="price-label">${values.prezzo.toFixed(2).toLocaleString('it-IT')} €</div>
        </label>
      </div>
    `;

    isFirst = false;
    const _elem = convertToHTML(elem);
    _elem.onclick = checkSelection;
    section.append(_elem);
  }
}

function setingredientsGroups(config) {
  const main_section = document.querySelector("#ingredients");
  const groups = config.gruppi;

  for (const [name, group] of Object.entries(groups)) {

    // contenitore del gruppo
    const section =
      `<section class="${name}">
      <div class="section-title-container">
        <span> </span>
        <h3 id="${name}">${name}</h3>
        <span class="${name}-limits">
          <span id="${name}-limit-current">0</span> / <span id="${name}-limit-max">-</span>
          <span class="extra-price">
            +<span id="extra-price-${name}"></span>€
          </span>
        </span>


        <h4>${group.extras}</h4>
      </div>

      <div class="options">

      </div>
    </section>
    `

    const sectionElem = convertToHTML(section);

    // opzioni del gruppo
    for (const option of group.opzioni) {
      const id = option.name.replaceAll(" ", "-").replaceAll("'", "--");
      const _opt =
        `<div class="option-container">
        <label for="${id}"> ${option.name} </label>
        <input type="checkbox" id="${id}" data-group="${name}">
        <span class="extra" title="aggiungi extra" >
          <i class="fa-solid fa-plus hover" data-group="${name}" data-option="${id}"></i>
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

  switch (checkType){
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
      break;
  }

  // save item from configurator on localStorage
  localStorage.setItem("item", JSON.stringify(selected));
}

function addExtra(evt) {
  const group = evt.target.dataset.group;
  const option = evt.target.dataset.option;

  addingredient(group, option)
}

function addingredient(group, option, quantity = 1) {
  if(!group) return;

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
 * Converts an item to a string
 * 
 * @param {Object} item
 * 
 * @retruns a string representing the item
 */
function toString(item = {}){

  let str = `${item.dimension.toUpperCase()}: `;
  const ingredients = item.ingredients;
  const groups = Object.keys(ingredients);
  groups.sort(sortIngredientGroups);

  for(const group of groups){
    for(const ingredient of ingredients[group]){
      str += ingredient.id.replaceAll("-", " ").replaceAll("--", "'") + (ingredient.quantity > 1 ? " x" + ingredient.quantity : "") + ", ";
    }
  }

  // rimozione ultima virgola
  str = str.slice(0, str.length - 2);

  return str;
}

function sortIngredientGroups(A, B){
  return config.gruppi[A].ordine - config.gruppi[B].ordine;
}

function copyOrder() {
  const text = document.querySelector("#generated-order");

  if (!text.value) {
    return;
  }

  text.select();
  text.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(text.value);
}

/**
 * Carica un ordine (da localstorage)
 */
function loadIntoConfigurator(_item = null) {
  let item = _item;
  if(!_item){
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
  if(elem) {
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

function changePreviewType() {
  const previewBtn = document.getElementById('fullorder-preview');
  const outputElem = document.getElementById("generated-order");
  const timeElem = document.getElementById('order-time-container');

  if(!outputElem) return;
  if(!previewBtn) return;
  if(!timeElem) return;

  if (previewBtn.checked) {
    outputElem.value = fullOrder;
    timeElem.style.display = '';
  } else {
    outputElem.value = compactOrder;
    timeElem.style.display = 'none';
  }

  outputElem.style.height = 'auto';
  outputElem.style.height = outputElem.scrollHeight + 10 + 'px';
}

function handleMenuClick(){
  // get details state
  const parentContainer = document.querySelector('#main-menu-container details');
  if(parentContainer && !parentContainer.open){
    // close theme menu
    loadTheme();
  }
}

function closeMenu(){
  const elem = document.querySelector('#main-menu-container details');
  if(elem) elem.open = false;
}

function addActions() {
  // extra of the same element
  document.querySelectorAll(".extra").forEach(elem => {
    if (elem) elem.onclick = addExtra
  });

  // recalculate limits on dimension change
  const btns_change_dim = document.querySelectorAll("#dimensione > div");
  if (btns_change_dim) btns_change_dim.forEach(elem => elem.onchange = recalculateLimits);

  // message preview
  const btn_preview_type = document.getElementById('fullorder-preview');
  if (btn_preview_type) btn_preview_type.onchange = changePreviewType;

  // dialogs comfirm with enter
  const dialog_name = document.getElementById('add-item-name');
  if(dialog_name) dialog_name.addEventListener('keypress', (evt) => {
    if(evt.key == 'Enter') addToCart();
  })

  const dialog_preview = document.getElementById('preview-order');
  if(dialog_preview) dialog_preview.addEventListener('keypress', (evt) => {
    if(evt.key == 'Enter') sendOrder();
  })

  // visualizza sempre una singola icona per ogni sottomenu all'apertura del menu
  const main_menu = document.getElementById('main-menu');
  if(main_menu) main_menu.onclick = handleMenuClick;
  
  // close menu if click outside of it
  const main_menu_container = document.getElementById('main-menu-container');
  document.addEventListener('touchstart', (evt) => handleCloseMenu(evt));
  document.addEventListener('mousedown', (evt) => handleCloseMenu(evt));
  function handleCloseMenu(evt){
    if(!main_menu_container.contains(evt.target)){
      closeMenu();
    }
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



