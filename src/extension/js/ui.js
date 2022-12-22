/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { getFontFaceOutput } from './shared/fonts.js';

const loadedFonts = [];

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

const FONTS_USED = document.getElementById('used');
const FONTS_TOTAL = document.getElementById('total');

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
  const tabId = parseInt(u.searchParams.get('tabId'), 10);
  const tab = await chrome.tabs.get(tabId);
  return tab;
};

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
};

/**
 * Forwards the extension console logs in the content window console.
 * @param {*} a console.log parameter one
 * @param {*} b console.log parameter two
 * @param {*} c console.log parameter three
 * @param {*} d console.log parameter four
 */
const log = async (a, b, c, d) => {
  const tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (pa, pb, pc, pd) => {
      // eslint-disable-next-line no-console
      console.log('[from extension]', pa, pb, pc, pd);
    },
    args: [a || '', b || '', c || '', d || ''],
  });
};

/**
 * Returns a select element with a selection of local fonts
 * @param {*} id The id of the select element
 * @returns {Element} The select element
 */
const getLocalFontSelect = (id) => {
  const select = document.createElement('select');
  select.id = id;
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
};

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

  await asyncForEach(loadedFonts, async (font) => {
    const { id, display } = font;

    const local = document.getElementById(`local-${id}`).value;
    const doProcess = document.getElementById(`process-${id}`).checked;

    if (!doProcess) return;

    log(`Computing fallback for ${display} with local ${local}`);

    try {
      const result = await sendMessage({
        fct: 'computeFallbackFont',
        params: {
          font, local,
        },
      });

      const { adjust, name, error } = result;

      if (error) {
        throw new Error(error);
      }

      RESULTS_CODE.innerHTML += getFontFaceOutput(font, { adjust, name, local });

      const label = document.createElement('label');
      label.innerHTML = `Replace <b>${display}</b> by <b>${name}</b>`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `simulate-${id}`;
      label.prepend(checkbox);

      checkbox.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const simulAdjust = document.getElementById(`simulate-${id}-adjust`).value;
          await sendMessage({ fct: 'replaceFont', params: { current: font, replace: { adjust: simulAdjust, name, local } } });
        } else {
          await sendMessage({ fct: 'removeFont', params: { remove: name } });
        }
      });

      const input = document.createElement('input');
      input.type = 'text';
      input.id = `simulate-${id}-adjust`;
      input.value = adjust;
      label.append(input);

      RESULTS_SIMULATION.append(label);
    } catch (error) {
      RESULTS_CODE.innerHTML += `Something went wrong while computing fallback for ${display}: \n${error}\n\n`;
    }
  });
  RESULTS_CODE.innerHTML += '\n';

  COPY_BUTTON.classList.remove('hidden');
  COMPUTING_PANEL.classList.add('hidden');
};

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
};

/**
 * Runs the back action
 */
const back = () => {
  RESULTS_PANEL.classList.add('hidden');
  FONTS_PANEL.classList.remove('hidden');
  COPY_BUTTON.classList.add('hidden');
};

/**
 * Initial setup
 */
const load = async () => {
  const tab = await getCurrentTab();

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['/js/content.js'],
  });

  const allFonts = (await sendMessage({ fct: 'getFonts' })) || [];

  log('allFonts', allFonts);

  LOADER_PANEL.classList.add('hidden');
  if (allFonts.length > 0) {
    COMPUTE_BUTTON.addEventListener('click', compute);
    COPY_BUTTON.addEventListener('click', copy);
    BACK_BUTTON.addEventListener('click', back);
    const unique = new Set();
    allFonts.forEach((font) => {
      const {
        status, id, display,
      } = font;
      if (status === 'loaded' && !unique.has(id)) {
        unique.add(id);
        loadedFonts.push(font);
        const label = document.createElement('label');
        label.for = id;
        label.innerText = display;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `process-${id}`;
        // checkbox.checked = true;
        label.prepend(checkbox);

        const select = getLocalFontSelect(`local-${id}`);
        label.appendChild(select);
        FONTS_GRID.append(label);
      }
    });
    FONTS_USED.innerHTML = loadedFonts.length;
    FONTS_TOTAL.innerHTML = allFonts.length;
    FONTS_PANEL.classList.remove('hidden');
  } else {
    log('No fonts found');
    NOFONTS_PANEL.classList.remove('hidden');
  }
};

load();
