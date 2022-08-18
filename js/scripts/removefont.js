(async () => {
  const src = chrome.runtime.getURL('/js/logic/fonts.js');
  const { getElementsUsingFont } = await import(src);

  const { input } = await chrome.storage.local.get('input');
  await chrome.storage.local.remove('input')

  getElementsUsingFont(input.remove).forEach((el) => {
    el.style.removeProperty('font-family');
  });
})();