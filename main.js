let config;

let selected = {
  dimension: "regular"
};


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
          <div class="price-label">${values.prezzo}</div>
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
      const id = option.split(" ").join("-")
      const _opt =
        `<div class="option-container">
        <label for="${id}"> ${option} </label>
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
    return;
  }
}

function addExtra(evt) {
  const group = evt.target.dataset.group;
  const option = evt.target.dataset.option;

  addingredient(group, option)
}

function addingredient(group, option, quantity = 1) {
  const limit = config.dimensioni[selected.dimension].limiti[group];

  if (!selected[group]) {
    selected[group] = [];
  }

  const ingredient = selected[group].find(x => x.id == option)
  if (ingredient) {
    ingredient.quantity += 1;
    quantity = ingredient.quantity;
  } else {
    selected[group].push({
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

  selected[group] = selected[group].filter(x => x.id != option);

  document.getElementById(option).checked = false;
  document.querySelector(".option-container:has(#" + option + ")").removeAttribute("data-extra");

  recalculateLimits();
}


function generateOrder() {
  const outputElem = document.querySelector("#generated-order");

  let order = `${selected.dimension.toUpperCase()}: `;

  const _selected = getSelectedIngredient();
  for (const [group, elements] of Object.entries(_selected)) {
    for (const element of elements) {
      order += element.id.replaceAll("-", " ") + (element.quantity > 1 ? " x" + element.quantity : "") + ", ";
    }
  }
  // rimozione ultima virgola
  order = order.slice(0, order.length - 2);

  outputElem.value = order;

  console.log(order)

  // salva in localstorage
  localStorage.setItem("poke", JSON.stringify(selected));
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
  for (const ingredient of document.querySelectorAll('input[type="checkbox"]')) {
    ingredient.checked = false;
  }

  document.getElementById("dim-" + order.dimension).checked = true;
  // seleziono gli ingredienti salvati
  for (const group of Object.keys(order)) {
    if (group != 'dimension') {
      for (const ingredient of order[group]) {
        addingredient(group, ingredient.id, ingredient.quantity)
        document.getElementById(ingredient.id).checked = true;
      }
    }
  }

  selected = order;
}

function clearOrder() {
  // rimuove tutti i checks
  const _selected = getSelectedIngredient();
  for (const group of Object.keys(_selected)) {
    for (const ingredient of _selected[group]) {
      removeIngredient(group, ingredient);
    }
  }

  const _dim = document.querySelector("input[type='radio']:checked").id.split("-")[1];
  selected = {
    dimension: _dim ?? "regular",
  }
}

function getSelectedIngredient() {
  let { dimension, ...ingredients } = selected;

  return ingredients;
}

// Ricalcola i limiti per tutti gli ingredienti selezionati
function recalculateLimits() {
  const _selected = getSelectedIngredient();
  
  if (!Object.keys(_selected).length) {
    for(const [group, max] of Object.entries(config.dimensioni[selected.dimension].limiti)){
      updateLimits(group, 0, max);
    }    
  } else {
    for (const group of Object.keys(_selected)) {
      let currentSelection = 0;

      for (const ingredient of _selected[group]) {
        currentSelection += ingredient.quantity;
      }

      let maxSelection = config.dimensioni[selected.dimension].limiti[group]

      updateLimits(group, currentSelection, maxSelection);
    }
  }


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


function addActions() {
  document.getElementById("generate-order").onclick = generateOrder;

  const copyOrderElem = document.getElementById("copy-order")
  if (!navigator.clipboard) {
    copyOrderElem.style.display = 'none';
  } else {
    copyOrderElem.onclick = copyOrder;
  }

  document.getElementById("clear-order").onclick = clearOrder;


  // extra of the same element
  document.querySelectorAll(".extra").forEach(elem => elem.onclick = addExtra);

  // recalculate limits on dimension change
  document.querySelectorAll("#dimensione > div").forEach(elem => elem.onchange = recalculateLimits);

}


async function setUp(){
  await loadConfig();

  fillHtml();
  
  loadOrder();
  
  addActions();
  
  recalculateLimits();
}


setUp();

async function loadConfig(){
  await fetch('./config.json')
  .then(res => res.json())
  .then(data => config = data)
  .catch(err => err);
}













