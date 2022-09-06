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
const TEXT = 'Where does it come from? Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.';
const MAX_STEPS = 1000;
const ADJUST_START = 100;
const STEP_START = 0.1;

/**
 * Computes a fallback font for the given font family and the local font to use as basis.
 * @param {Object} config - The computation configuration
 * @param {string} config.family - The font family to compute the fallback for
 * @param {string} config.local - The local font to use as fallback
 * @param {Element} [config.elememt] - The DOM element used to compute the fallback
 * - if not provided, the function will create one
 * @param {boolean} [config.removeElement] - Remove the element after computation (default: true)
 * @param {boolean} [config.deleteFont] - Remove the fallback fontface inserted
 * into the document (default: false)
 * @param {string} [config.property] - The CSS property to use
 * for the computation (default: 'offsetWidth')
 * @returns {Object} - The computed fallback font configuration.
 * The object contains the following properties:
 * - name: the name of the fallback font
 * - adjust: the size-adjust value
 * - local: the local font used as fallback
 * - steps: the number of steps needed to compute the fallback
 */
const computeFallbackFont = async ({
  family, local, element: el, removeElement = true, property = 'offsetWidth', deleteFont = false,
}) => {
  console.log(`Attempt to find fallback for font ${family}`);

  if (!el) {
    el = document.createElement('p');
    document.body.append(el);
    el.innerHTML = TEXT;
    el.style['white-space'] = 'pre';
    el.style.display = 'inline-block';
  }

  el.style['font-family'] = `"${family}"`;

  const initial = el[property];

  console.log(`Initial value for property ${property}: ${initial}`);

  const fallbackFont = `${family}-fallback`;
  el.style['font-family'] = `"${fallbackFont}"`;

  let steps = 0;
  let adjust = ADJUST_START;
  let step = STEP_START;
  // step1 is necessary to avoid extra decimals...
  let step1 = 1 / step;
  let diff = 0;

  const diffs = [];
  const adjusts = [];

  do {
    // console.log(`Trying with adjust: ${adjust}`);
    const fontface = new FontFace(fallbackFont, `local("${local}")`, { sizeAdjust: `${adjust}%` });
    // eslint-disable-next-line no-await-in-loop
    await fontface.load();
    document.fonts.add(fontface);

    // console.log(`Values (current / initial): ${el[property]} / ${initial}`);
    diff = el[property] - initial;

    if (deleteFont) document.fonts.delete(fontface);

    if (diff === 0) break;

    if (diff > 0) {
      if (diffs.length > 1 && diffs[diffs.length - 1] < diff) {
        // sign changed, need to reduce step size
        step /= 10;
        step1 = 1 / step;
        // console.log(`Adjusting step (minus): ${step}`);
        adjust = ((adjusts[adjusts.length - 1] * step1) - (step * step1)) / step1;
      } else {
        adjust = ((adjust * step1) - (step * step1)) / step1;
      }
    } else if (diffs.length > 1 && diffs[diffs.length - 1] > diff) {
      // sign changed, need to reduce step size
      step /= 10;
      step1 = 1 / step;
      // console.log(`Adjusting step (plus): ${step}`);
      adjust = ((adjusts[adjusts.length - 1] * step1) + (step * step1)) / step1;
    } else {
      adjust = ((adjust * step1) + (step * step1)) / step1;
    }

    diffs.push(diff);
    adjusts.push(adjust);

    steps += 1;
  } while (steps < MAX_STEPS && step > 0.001);

  if (removeElement) {
    el.remove();
  }

  if (steps < MAX_STEPS) {
    return {
      local,
      adjust,
      steps,
      name: fallbackFont,
    };
  }
  throw new Error(`Could not find font adjust for "${family}": ${adjust} (${el[property]} / ${initial})`);
};

/**
 * Returns a string representing the CSS definition of a fallback fontface.
 * @param {string} family - The font family the fallback font is for
 * @param {Object} fallback - The fallback font
 * @param {string} fallback.local - The local font to use as fallback
 * @param {string} fallback.adjust - The size-adjust value
 * @param {string} fallback.name - The name of the fallback font
 * @returns {string} - The CSS definition of the fallback fontface
 */
const getFontFaceOutput = (family, { name, adjust, local }) => `
  /* fallback font for ${family} */
  @font-face {
    font-family: "${name}";
    size-adjust: ${adjust}%;
    src: local("${local}");
  }\n`;

/**
 * Returns the elements of the document using the provided font family.
 * @param {string} family - The font family to search for
 * @returns {Array[Element]} - The elements using the provided font family
 */
const getElementsUsingFont = (family) => {
  console.log(`Searching for elements using font ${family}`);
  const elements = [];

  const familyLC = family.toLowerCase().trim();
  document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, li, span').forEach((el) => {
    const currentFamily = window.getComputedStyle(el).getPropertyValue('font-family').toLowerCase().trim();

    if (currentFamily.includes(familyLC)) {
      elements.push(el);
    }
  });

  console.log(`Found ${elements.length} elements.`, elements);
  return elements;
};

export { computeFallbackFont, getFontFaceOutput, getElementsUsingFont };
