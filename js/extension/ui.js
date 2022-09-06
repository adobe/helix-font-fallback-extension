import { getFontFaceOutput } from '../logic/fonts.js';

let fonts = [];

const LOADER_PANEL = document.getElementById('loader');
const NOFONTS_PANEL = document.getElementById('nofonts');
const FONTS_PANEL = document.getElementById('fonts');
const COMPUTING_PANEL = document.getElementById('computing');
const RESULTS_PANEL = document.getElementById('results');

const COMPUTE_BUTTON = document.getElementById('compute');
const COPY_BUTTON = document.getElementById('copy');
const BACK_BUTTON = document.getElementById('back');

const FONTS_GRID = document.querySelector('#fonts .grid');
const RESULTS_CODE = document.querySelector('#results pre');
const RESULTS_SIMULATION = document.querySelector('#results form');

/**
 * Async array forEach
 * @param {Array} array The array to iterate over
 * @param {*} callback The method to call for each item
 */
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
};

/**
 * Returns the current tab
 * @returns {chrome.tabs.Tab} The current tab
 */
const getCurrentTab = async () => {
  const u = new URL(window.location.href);
  const tabId = parseInt(u.searchParams.get('tabId'));
  const tab = await chrome.tabs.get(tabId);
  return tab;
}

/**
 * Sends a message to the content window
 * @param {Object} message The message to send
 * @returns {Promise<Object} The response result
 */
const sendMessage = async (message) => {
  const tab = await getCurrentTab();
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, message, resolve);
  });
}

/**
 * Forwards the extension console logs in the content window console.
 * @param {*} a console.log parameter one
 * @param {*} b console.log parameter two
 * @param {*} c console.log parameter three
 * @param {*} d console.log parameter four
 */
const log = async function (a, b, c, d) {
  const tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function (a, b, c, d) {
      console.log('[from extension]', a, b, c, d);
    },
    args: [a || '', b || '', c || '', d || ''],
  });
}

/**
 * Returns a select element with a selection of local fonts
 * @param {*} id The id of the select element
 * @returns {Element} The select element
 */
const getLocalFontSelect = (id) => {
  const select = document.createElement('select');
  select.id = `local-${id}`;
  select.required = true;

  [{ 
    name: 'Arial',
    cat: 'sans-serif',
  }, {
    name: 'Verdana',
    cat: 'sans-serif',
  }, {
    name: 'Helvetica',
    cat: 'sans-serif',
  }, {
    name: 'Tahoma',
    cat: 'sans-serif',
  }, {
    name: 'Trebuchet MS',
    cat: 'sans-serif',
  }, {
    name: 'Times New Roman',
    cat: 'serif', 
  }, {
    name: 'Georgia',
    cat: 'serif', 
  }, {
    name: 'Courier New',
    cat: 'monospace', 
  }].forEach((font) => {
    const option = document.createElement('option');
    option.value = font.name;
    option.innerHTML = `${font.name} (${font.cat})`;
    select.appendChild(option);
  });
  
  return select;
}

/**
 * Runs the compute action
 */
const compute = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  FONTS_PANEL.classList.add('hidden');
  COMPUTING_PANEL.classList.remove('hidden');
  RESULTS_CODE.innerHTML = '';
  RESULTS_SIMULATION.innerHTML = '';
  RESULTS_PANEL.classList.remove('hidden');

  const tab = await getCurrentTab();

  await asyncForEach(fonts, async (family) => {
    const local = document.getElementById(`local-${family}`).value;
    const doProcess = document.getElementById(`process-${family}`).checked;

    if (!doProcess) return;

    log(`Computing fallback for ${family} with local ${local}`);
      
    try {
      const result = await sendMessage({ fct: 'computeFallbackFont', params: { family, local } });

      console.log('computeFallbackFont result', result);

      const { adjust, name, error } = result;

      if (error) {
        throw new Error(error);
      }
    
      RESULTS_CODE.innerHTML += getFontFaceOutput(family, { adjust, name, local });
      
      const label = document.createElement('label');
      label.innerHTML = `Replace <b>${family}</b> by <b>${name}</b>`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'simulate-' + family;
      label.prepend(checkbox);

      checkbox.addEventListener('change', async (event) => {
        if (event.target.checked) {
          await sendMessage({ fct: 'replaceFont', params: { current: family, replace: name } });
        } else {
          await sendMessage({ fct: 'removeFont', params: { remove: name } });
        }
      });

      RESULTS_SIMULATION.append(label);

    } catch (error) {
      RESULTS_CODE.innerHTML += `Something went wrong while computing fallback for ${family}: \n${error}\n\n`;
    }
  });
  RESULTS_CODE.innerHTML += '\n';

  COPY_BUTTON.classList.remove('hidden');
  COMPUTING_PANEL.classList.add('hidden');
}

/**
 * Runs the copy (to clipboard...) action
 */
const copy = async () => {
  const textarea = document.createElement('textarea');
  textarea.value = RESULTS_CODE.innerHTML;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

/**
 * Runs the back action
 */
const back = () => {
  RESULTS_PANEL.classList.add('hidden');
  FONTS_PANEL.classList.remove('hidden');
  COPY_BUTTON.classList.add('hidden');
}

/**
 * Initial setup 
 */
const load = async () => {
  const tab = await getCurrentTab();

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['./content.js'],
  });

  fonts = (await sendMessage({ fct: 'getFonts' })) || [];
  
  log('fonts', fonts);

  LOADER_PANEL.classList.add('hidden');
  if (fonts.length > 0) {
    COMPUTE_BUTTON.addEventListener('click', compute);
    COPY_BUTTON.addEventListener('click', copy);
    BACK_BUTTON.addEventListener('click', back);
    fonts.forEach((family) => {
      const id = family;
      const label = document.createElement('label');
      label.for = id;
      label.innerText = `${family}`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'process-' + family;
      checkbox.checked = true;
      label.prepend(checkbox);

      const select = getLocalFontSelect(id);
      label.appendChild(select);
      FONTS_GRID.append(label);
    });
    FONTS_PANEL.classList.remove('hidden');
  } else {
    log('No fonts found');
    NOFONTS_PANEL.classList.remove('hidden');
  }
};

load();