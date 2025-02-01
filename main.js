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

  document.querySelector("header").append(convertToHTML(elem));
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
          <div class="price-label">${values.prezzo.toLocaleString('it-IT')} €</div>
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
  const main_section = document.querySelector("#main");
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
      const id = option.name.replaceAll(" ", "-").replaceAll("'","--");
      const _opt =
      `<div class="option-container">
        <label for="${id}"> ${option.name} </label>
        <input type="checkbox" id="${id}" data-group="${name}">
        <span class="extra" title="aggiungi extra" >
          <i class="fa-solid fa-plus" data-group="${name}" data-option="${id}"></i>
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

function convertToHTML(string) {
  const _tmp = document.createElement("div");
  _tmp.innerHTML = string;
  return _tmp.firstChild;
}

// esegue controlli al click di ogni elemento delle sezioni
// in particolare verifica che non venga superato il limite di elementi in base alla dimensione scelta
function checkSelection(evt) {
  const selectedElem = evt.target;
  if (selectedElem.getAttribute("type") == "checkbox") {
    const group = selectedElem.dataset.group;

    if (selectedElem.checked) {
      addingredient(group, selectedElem.id)
    } else {
      removeIngredient(group, selectedElem.id);
    }
    return;
  }

  if (selectedElem.getAttribute("type") == "radio") {
    selected.dimension = selectedElem.id.split("-")[1];
    generateOrder();
    return;
  }
}

function addExtra(evt) {
  const group = evt.target.dataset.group;
  const option = evt.target.dataset.option;

  addingredient(group, option)
}

function addingredient(group, option, quantity = 1, generate = true) {
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
  if(generate) generateOrder();
}

function removeIngredient(group, option, generate = true) {
  if (typeof option != "string") {
    option = option.id || "";
  }

  selected.ingredients[group] = selected.ingredients[group].filter(x => x.id != option);

  document.getElementById(option).checked = false;
  document.querySelector(".option-container:has(#" + option + ")").removeAttribute("data-extra");

  recalculateLimits();
  if(generate) generateOrder();
}


function changeTime() {
  const order_time = document.getElementById('order-time');
  if (order_time) selected['time'] = order_time.value;
  
  generateOrder();
}

/**
 * Genera stringa dell'ordine
 */
function generateOrder() {

  let order = `${selected.dimension.toUpperCase()}: `;

  const _selected = selected.ingredients;
  for (const [group, elements] of Object.entries(_selected)) {
    for (const element of elements) {
      order += element.id.replaceAll("-", " ").replaceAll("--", "'") + (element.quantity > 1 ? " x" + element.quantity : "") + ", ";
    }
  }
  // rimozione ultima virgola
  order = order.slice(0, order.length - 2);

  // recupero orario
  const order_time = document.getElementById('order-time');
  
  const complete_order_string =
  `Buongiorno,
Vorrei ordinare una poke da asporto che passerei a ritirare ${order_time.value ? "per le: " : "a breve"}${order_time.value}.

${order}`;
  
  
  compactOrder = order;
  fullOrder = complete_order_string;

  changePreviewType();

  // salva in localstorage
  localStorage.setItem("poke", JSON.stringify(selected));

  return order;
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
function loadOrder() {
  console.log("Loading order from localStorage...");

  let order;
  try {
    order = JSON.parse(localStorage.getItem("poke"));
  } catch (error) {
    console.error("Failed to load order from localStorage")
    return;
  }
  if (!order) return;

  // rimuove tutti i checks
  for (const ingredient of document.querySelectorAll('section input[type="checkbox"]')) {
    ingredient.checked = false;
  }

  document.getElementById('order-time').value = order.time;
  selected.time = order.time;

  document.getElementById("dim-" + order.dimension).checked = true;

  // seleziono gli ingredienti salvati
  for (const group of Object.keys(order.ingredients)) {
    for (const ingredient of order.ingredients[group]) {
      addingredient(group, ingredient.id, ingredient.quantity, false);
      document.getElementById(ingredient.id).checked = true;
    }
  }

  generateOrder();

  console.log(order);

  selected = JSON.parse(JSON.stringify(order));
}

function clearOrder() {
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
    ingredients: {}
  }

  fullOrder = '';
  compactOrder = '';

  document.getElementById('generated-order').value = '';
  document.getElementById('order-time').value = null;
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

    if(currentSelection > maxSelection){
      extra[group] = {current: currentSelection, max: maxSelection};
    }
  }

  //updatePrice(extra);
}

function updatePrice(extra){
  // alcuni gruppi di ingredienti sono più di quelli inclusi nella dimensione scelta
  // calcolo costo extra
  const basePrice = config.dimensioni[selected.dimension].prezzo;
  let extraPrice = 0;
  console.log("base price: ", basePrice);
  console.log(Object.keys(extra));
  
  for(const group of Object.keys(extra)){
    console.log("Calculate extra for group: ", group);
    const outOfLimits = extra[group].current - extra[group].max;

    // recupera elementi del gruppo
    const selectedInGroup = JSON.parse(JSON.stringify(selected.ingredients[group]));
    
    // ordine elementi del gruppo per prezzo
    selectedInGroup.sort(sortIngredientByPrice);
    
    console.log(...selectedInGroup);
    
    // aggiunge il prezzo degli n meno costosi
    let counter = outOfLimits;
    while(counter > 0){
      selectedInGroup[0].quantity--;

      extraPrice += getPrice(selectedInGroup[0].id);

      if(selectedInGroup[0].quantity <= 0){
        selectedInGroup.splice(0, 1)
      }

      counter--;
    }

    console.log("Prezzo extra: ", extraPrice);
    
  }
}

function sortIngredientByPrice(A, B){
  // recupera prezzi degli ingredienti da confrontare
  return getPrice(A) - getPrice(B);
}


function getPrice(ingredient){
  for(const [group, ingredients] of Object.entries(config.gruppi)){
    const _ingredient = ingredients.opzioni.find(i => i.name.replaceAll(" ", "-").replaceAll("'", "--") == ingredient)
    if(_ingredient){
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

function addOrderToMessage(evt) {
  const elem = evt.target;
  let order = document.getElementById('generated-order').value;

  // controllo ordine completo
  // poke configurata
  if (!order) {
    evt.preventDefault();
    return;
  }

  elem.href = `https://wa.me/${config.numero_telefono}/?text=` + encodeURIComponent(order);
}

function changePreviewType(){
  const previewBtn = document.getElementById('fullorder-preview');
  const outputElem = document.getElementById("generated-order");
  const timeElem = document.getElementById('order-time-container');

  if(previewBtn.checked){
    outputElem.value = fullOrder;
    timeElem.style.display = '';
  } else {
    outputElem.value = compactOrder;
    timeElem.style.display = 'none';
  }

  outputElem.style.height = 'auto';
  outputElem.style.height = outputElem.scrollHeight + 10 + 'px';
}


function addActions() {
  const btn_clear_order = document.getElementById("clear-order");
  if (btn_clear_order) btn_clear_order.onclick = clearOrder;

  // extra of the same element
  document.querySelectorAll(".extra").forEach(elem => {
    if (elem) elem.onclick = addExtra
  });

  // recalculate limits on dimension change
  const btns_change_dim = document.querySelectorAll("#dimensione > div");
  if (btns_change_dim) btns_change_dim.forEach(elem => elem.onchange = recalculateLimits);

  // capture change time
  const btn_time = document.getElementById('order-time');
  if (btn_time) btn_time.onchange = changeTime;

  // link order for message
  const btn_send_order = document.getElementById('send-order');
  if (btn_send_order) btn_send_order.onclick = addOrderToMessage;

  // message preview
  const btn_preview_type = document.getElementById('fullorder-preview');
  if (btn_preview_type) btn_preview_type.onchange = changePreviewType; 
}


async function setUp() {
  await loadConfig();

  fillHtml();

  addActions();

  loadOrder();

  recalculateLimits();
}

setUp();

async function loadConfig() {
  await fetch('./config.json')
    .then(res => res.json())
    .then(data => config = data)
    .catch(err => err);
}



