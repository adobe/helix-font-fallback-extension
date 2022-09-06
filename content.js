{
  /** 
   * Sets the font-family on all elements in the document using (getComputedStyle) the provided font family.
   * @param {Object} params - Parameter object
   * @param {string} params.current - The font family to search for
   * @param {string} params.replace - The font family to replace with
   */
  const replaceFont = async ({ current, replace }) => {
    const src = chrome.runtime.getURL('/js/logic/fonts.js');
    const { getElementsUsingFont } = await import(src);

    getElementsUsingFont(current).forEach((el) => {
      el.style['font-family'] = `"${replace}"`;
    });
  };

  /** 
   * Removes the font-family property from all elements of the document using the provided font family.
   * @param {Object} params - Parameter object
   * @param {string} params.remove - The font family to remove
   */
  const removeFont = async ({ remove }) => {
    const src = chrome.runtime.getURL('/js/logic/fonts.js');
    const { getElementsUsingFont } = await import(src);
  
    getElementsUsingFont(remove).forEach((el) => {
      el.style.removeProperty('font-family');
    });
  };

  /** 
   * Returns all the fonts used on in the current document.
   * @returns {Array[string]} - The list of font family
   */
  const getFonts = () => {
      const fonts = [];

      document.fonts.forEach(({ family }) => {
        if (!family.includes('fallback') && !fonts.includes(family)) {
          fonts.push(family);
        }
      });

      return fonts.sort((a, b) => a.localeCompare(b));
  };

  /**
   * Computes a fallback font for the provided font family based on a local font.
   * @param {Object} params - Parameter object
   * @param {string} params.family - The font family
   * @param {string} params.local - The local font to use as fallback
   * @returns {Object} - The computed fallback font configuration. The object contains the following properties:
   * - name: the name of the fallback font
   * - adjust: the size-adjust value
   * - local: the local font used as fallback
   * - steps: the number of steps needed to compute the fallback
   */
  const computeFallbackFont = async ({ family, local }) => {
    try {
      const src = chrome.runtime.getURL('/js/logic/fonts.js');
      const { computeFallbackFont } = await import(src);
  
      const font = await computeFallbackFont({ family, local });
      console.log('Computed fallback font: ', font);
      return font;
    } catch (e) {
      console.error(e);
      return { error: e.message };
    }
  };

  chrome.runtime.onMessage.addListener(({ fct, params }, sender, sendResponse) => {
    const handleResponse = async () => {
      console.log('Received message from extension', fct, params);

      let result;
      if (fct === 'getFonts') {
        result = getFonts();
      } else if (fct === 'replaceFont') {
        result = await replaceFont(params);
      } else if (fct === 'removeFont') {
        result = await removeFont(params);
      } else if (fct === 'computeFallbackFont') {
        result = await computeFallbackFont(params);
      } else {
        result = { error: 'Unknown function' };
      }

      console.log('result in content window', result);
      sendResponse(result);
    };
    handleResponse();
    return true;
  });
}