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
{
  /**
   * Sets the font-family on all elements
   * in the document using (getComputedStyle) the provided font family.
   * @param {Object} params - Parameter object
   * @param {string} params.current - The font family to search for
   * @param {string} params.replace - The font family to replace with
   */
  const replaceFont = async ({ current, replace }) => {
    const src = chrome.runtime.getURL('/js/shared/fonts.js');

    // re-add font to keep font in the document
    const fontface = new FontFace(replace.name, `local("${replace.local}")`, { sizeAdjust: `${replace.adjust}%` });
    await fontface.load();
    document.fonts.add(fontface);

    const { getElementsUsingFont } = await import(src);

    getElementsUsingFont(current.family, current.style, current.weight).forEach((el) => {
      el.style['font-family'] = `"${replace.name}"`;
    });
  };

  /**
   * Removes the font-family property
   * from all elements of the document using the provided font family.
   * @param {Object} params - Parameter object
   * @param {string} params.remove - The font family to remove
   */
  const removeFont = async ({ remove }) => {
    const src = chrome.runtime.getURL('/js/shared/fonts.js');
    const { getElementsUsingFont } = await import(src);

    getElementsUsingFont(remove).forEach((el) => {
      el.style.removeProperty('font-family');
    });

    Array.from(document.fonts).forEach((font) => {
      if (font.family === remove) {
        document.fonts.delete(font);
      }
    });
  };

  /**
   * Returns all the fonts used on in the current document.
   * @returns {Array[string]} - The list of font family
   */
  const getFonts = async () => {
    try {
      const src = chrome.runtime.getURL('/js/shared/fonts.js');
      const { getFonts: gf } = await import(src);

      return gf();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return { error: e.message };
    }
  };

  /**
   * Computes a fallback font for the provided font family based on a local font.
   * @param {Object} params - Parameter object
   * @param {string} params.family - The font family
   * @param {string} params.local - The local font to use as fallback
   * @returns {Object} - The computed fallback font configuration.
   * The object contains the following properties:
   * - name: the name of the fallback font
   * - adjust: the size-adjust value
   * - local: the local font used as fallback
   * - steps: the number of steps needed to compute the fallback
   */
  const computeFallbackFont = async ({
    font, local,
  }) => {
    try {
      const src = chrome.runtime.getURL('/js/shared/fonts.js');
      const { computeFallbackFont: cff } = await import(src);

      const fallback = await cff({ font, local });
      return fallback;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return { error: e.message };
    }
  };

  chrome.runtime.onMessage.addListener(({ fct, params }, sender, sendResponse) => {
    const handleResponse = async () => {
      // eslint-disable-next-line no-console
      console.log('Received message from extension', fct, params);

      let result;
      if (fct === 'getFonts') {
        result = await getFonts();
      } else if (fct === 'replaceFont') {
        result = await replaceFont(params);
      } else if (fct === 'removeFont') {
        result = await removeFont(params);
      } else if (fct === 'computeFallbackFont') {
        result = await computeFallbackFont(params);
      } else {
        result = { error: 'Unknown function' };
      }

      sendResponse(result);
    };
    handleResponse();
    return true;
  });
}
