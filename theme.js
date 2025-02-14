
/**
 * Handles theme selection and switch
 * 
 * @param {String} type - theme type
 */
function handleTheme(type){
  const themes = ['auto', 'light', 'dark'];

  // default to auto
  if(!type || !themes.includes(type)){
    type = 'auto';
  }

  const prevTheme = document.body.dataset.theme;

  const btns = Array.from(document.querySelectorAll("[id^='theme-icon']"));
  const allvisible = btns.findIndex(b => b.classList.contains('hidden')) < 0;
  
  if(!allvisible && type == prevTheme){
    // open selection
    for(const btn of btns){
      btn.classList.remove('hidden');
    }
  } else {
    setTheme(type)
  }
}

/**
 * Set a particolar theme type
 * 
 * @param {String} type - theme type to set
 */
function setTheme(type){
  document.body.dataset.theme = type;

  localStorage.setItem('preferred-theme', type);

  const btns = Array.from(document.querySelectorAll("[id^='theme-icon']"));
  for(const btn of btns){
    if(btn.id.endsWith(type)){
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }
}


/**
 * Loads theme from localStorage or set default to auto
 */
function loadTheme(){

  const preferred_theme = localStorage.getItem('preferred-theme');
  if(preferred_theme){
    setTheme(preferred_theme);
  } else {
    setTheme('auto');
  }
}

loadTheme();