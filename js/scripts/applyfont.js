(async () => {
  const src = chrome.runtime.getURL('/js/logic/fonts.js');
  const { getElementsUsingFont } = await import(src);

  const { input } = await chrome.storage.local.get('input');
  const { family, apply } = input;
  await chrome.storage.local.remove('input')

  getElementsUsingFont(family).forEach((el) => {
    el.style['font-family'] = `"${apply}"`;
  });
})();