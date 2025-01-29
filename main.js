const config = {
  dimensioni: {
    regular: {
      limiti: {
        proteina: 1,
        condimenti: 4,
        croccantini: 2,
        salse: 3
      },
      prezzo: "8,90 €"
    },
    large: {
      limiti: {
        proteina: 2,
        condimenti: 5,
        croccantini: 2,
        salse: 3
      },
      prezzo: "10,90 €"
    }
  },
  gruppi: {
    proteina: {
      ordine: 0,
      extras: "extra salmone tonno crudo € 2.00 / altri € 1.50",
      opzioni: [
        "salmone crudo",
        "tonno crudo",
        "salmone cotto",
        "tonno sott'olio",
        "gamberi cotti",
        "tempura di gamberi",
        "cotoletta di pollo",
        "pollo cotto",
        "tofu fresco",
        "uova sode",
        "uova al tegamino"
      ]
    },
    condimenti: {
      ordine: 1,
      extras: "extra € 0.50",
      opzioni: [
        "alghe wakame",
        "mais",
        "avocado",
        "ceci",
        "pomodorino",
        "edamamme",
        "peperoni",
        "fagioli",
        "cetrioli",
        "mango",
        "carote",
        "zenzero",
        "ananas",
        "olive nere"
      ]
    },
    croccantini: {
      ordine: 2,
      extras: "extra € 0.50",
      opzioni: [
        "anacardi",
        "mandorle",
        "alghe nori",
        "sesamo",
        "tobico",
        "kataifi",
        "noci",
        "cipolla croccante",
        "pistacchio"
      ]
    },
    salse: {
      ordine: 3,
      extras: "extra € 0.50",
      opzioni: [
        "olio di oliva",
        "aceto balsamico",
        "soia",
        "maionese",
        "philadelphia",
        "teriyaki",
        "wasabi",
        "spicy maionese",
        "salsa mango",
        "salsa ponzu",
        "salsa agrodolce",
        "salsa agropiccante",
        "salsa yogurt"
      ]
    }
  },
  titolo: "Nome ristorante",
  sotto_titolo: "Breve descrizione",
  sotto_titolo_2: "Info aggiuntive",
}

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
        <h3>${name}</h3>
      </div>

      <h4>${group.extras}</h4>

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

  if(quantity > 1){
    document.querySelector(".option-container:has(#" + option + ")").setAttribute("data-extra", quantity)
  }

  if (selected[group].length > limit) {
    const elemClass = selected.dimension + "-" + group;
    const elem = document.querySelector("." + elemClass);
    elem.classList.add("over-limit");
  }
}

function removeIngredient(group, option) {
  if(typeof option != "string"){
    option = option.id || "";
  }

  const limit = config.dimensioni[selected.dimension].limiti[group];

  selected[group] = selected[group].filter(x => x.id != option);
  
  document.getElementById(option).checked = false;
  document.querySelector(".option-container:has(#" + option + ")").removeAttribute("data-extra");

  if (selected[group].length <= limit) {
    const elemClass = selected.dimension + "-" + group;
    const elem = document.querySelector("." + elemClass);
    elem.classList.remove("over-limit");
  }

  console.log(selected[group]);
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

  // selected = order;
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
  console.log(selected);

  let { dimension, ...ingredients } = selected;
  console.log(ingredients);

  return ingredients;
}

// Ricalcola i limit per gruppo di ingredienti
function recalculateLimits() {

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
}

fillHtml();

loadOrder();

addActions();


















