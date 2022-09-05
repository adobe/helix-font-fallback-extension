{
  const replaceFont = async ({ current, replace }) => {
    const src = chrome.runtime.getURL('/js/logic/fonts.js');
    const { getElementsUsingFont } = await import(src);

    getElementsUsingFont(current).forEach((el) => {
      el.style['font-family'] = `"${replace}"`;
    });
  };

  const removeFont = async ({ remove }) => {
    const src = chrome.runtime.getURL('/js/logic/fonts.js');
    const { getElementsUsingFont } = await import(src);
  
    getElementsUsingFont(remove).forEach((el) => {
      el.style.removeProperty('font-family');
    });
  };

  const getFonts = () => {
      const fonts = [];

      document.fonts.forEach(({ family }) => {
        if (!family.includes('fallback') && !fonts.includes(family)) {
          fonts.push(family);
        }
      });

      return fonts.sort((a, b) => a.localeCompare(b));
  };

  const computeFallbackFont = async ({ family, local }) => {
    try {
      const src = chrome.runtime.getURL('/js/logic/fonts.js');
      const { findFallbackFont } = await import(src);
  
      const font = await findFallbackFont({ family, local });
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