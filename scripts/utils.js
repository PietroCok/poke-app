/**
 * Loads main config file
 */
async function loadConfig() {
  await fetch('./config.json')
    .then(res => res.json())
    .then(data => config = data)
    .catch(err => err);
}
  
/**
 * Returns random id string
 */
function getRandomId(minlength = 0) {
  let id = '';
  do {
    id += Math.random().toString(36).slice(2)
  } while (id.length < minlength)
  return id;
}

/**
 * Converts a string to an HTML elem
 * 
 * @param {String} string - string representation of a **SINGLE** HTML element
 * @returns HTML element
 */
function convertToHTML(string) {
  const _tmp = document.createElement("div");
  _tmp.innerHTML = string;
  return _tmp.firstChild;
}

/**
 * Closes a dialog element by its id
 * 
 * @param {String} id 
 */
function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.close();
}

/**
 * Show a dialog element by its id
 * 
 * @param {String} id 
 */
function showDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog) dialog.showModal();
}

/**
 * Converts an item to a string
 * 
 * @param {Object} item
 * 
 * @retruns a string representing the item
 */
function toString(item) {
  let str = '';
  try {
    str = `${item.dimension.toUpperCase()}: `;
    const ingredients = item.ingredients;
    const groups = Object.keys(ingredients);
    groups.sort(sortIngredientGroups);

    for (const group of groups) {
      for (const ingredient of ingredients[group]) {
        str += ingredient.id.replaceAll("-", " ").replaceAll("--", "'") + (ingredient.quantity > 1 ? " x" + ingredient.quantity : "") + ", ";
      }
    }

    // rimozione ultima virgola
    str = str.slice(0, str.length - 2);
  } catch (error) {
    str = 'Error loading item description...'
  }

  return str;
}


function checkEmailFormat(email){
  const regex = /.+@.+\..+/;
  if(!email.match(regex)){
    return false;
  }
  return true;
}

function checkPasswordFormat(password){
  if(!password || password.length < 6){
    return false;
  }
  return true;
}

/**
 * Close single page
 * 
 * @param {String} id 
 */
function closePage(id){
  if(!id) return;

  const page = document.getElementById(id);
  if(page) page.classList.add('hidden');
}

/**
 * Close all pages
 */
function closeAllPages(){
  for(const page of pages){
    page.classList.add('hidden');
  }
}