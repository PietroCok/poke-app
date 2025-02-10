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
 * Loads main config file
 */
async function loadConfig() {
    await fetch('./config.json')
        .then(res => res.json())
        .then(data => config = data)
        .catch(err => err);
}