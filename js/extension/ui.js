import { getFontFaceOutput } from '../logic/fonts.js';

const fonts = [];

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

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
};

const getCurrentTab = async () => {
  const u = new URL(window.location.href);
  const tabId = parseInt(u.searchParams.get('tabId'));
  const tab = await chrome.tabs.get(tabId);
  return tab;
}

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

const getDefaultFallbackFontSelect = (id) => {
  const select = document.createElement('select');
  select.id = `fallback-${id}`;
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
    const fallback = document.getElementById(`fallback-${family}`).value;
    const doProcess = document.getElementById(`process-${family}`).checked;

    if (!doProcess) return;

    log(`Computing fallback for ${family} with fallback ${fallback}`);
      
    await chrome.storage.local.set({ 
      input: {
        family,
        fallback
      }
    });

    const promise = new Promise((resolve, reject) => {
      // check until the result is available
      const interval = window.setInterval(async () => {
        const { output, error } = await chrome.storage.local.get(['output', 'error']);
        log('Checking storage for output', output);
        if (output) {
          window.clearInterval(interval);
          await chrome.storage.local.remove('output');
          resolve(output);
        } else {
          if (error) {
            window.clearInterval(interval);
            await chrome.storage.local.remove('error');
            reject(error);
          }
        }
      }, 1000);
    });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['./js/scripts/computefallbackfont.js'],
    });

    try {
      const { adjust, name } = await promise;
    
      RESULTS_CODE.innerHTML += getFontFaceOutput(family, name, adjust, fallback);
      
      const label = document.createElement('label');
      label.innerHTML = `Replace <b>${family}</b> by <b>${name}</b>`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'simulate-' + family;
      label.prepend(checkbox);

      checkbox.addEventListener('change', async (event) => {
        if (event.target.checked) {
          await chrome.storage.local.set({ 
            input: {
              family,
              apply: name,
            }
          });
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['./js/scripts/applyfont.js'],
          });
        } else {
          await chrome.storage.local.set({ 
            input: {
              remove: name,
            }
          });

          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['./js/scripts/removefont.js'],
          });
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
const copy = async () => {
  const textarea = document.createElement('textarea');
  textarea.value = RESULTS_CODE.innerHTML;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

const back = () => {
  RESULTS_PANEL.classList.add('hidden');
  FONTS_PANEL.classList.remove('hidden');
  COPY_BUTTON.classList.add('hidden');
}

const load = async () => {
  const tab = await getCurrentTab();

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['./js/scripts/getfonts.js'],
  });

  if (results && results.length > 0) {
    results[0].result.forEach((font) => {
      const { family } = font;
      fonts.push(family);
    });
  }

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

      const select = getDefaultFallbackFontSelect(id);
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