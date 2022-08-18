(async () => {
  console.log('trying to apply font');
  const src = chrome.runtime.getURL('/js/business/fonts.js');
  const { getElementsUsingFont } = await import(src);

  console.log('trying to apply font 2');
  const { input } = await chrome.storage.local.get('input');
  await chrome.storage.local.remove('input')

  console.log('input: ', input);

  getElementsUsingFont(input.family, input.weight).forEach((el) => {
    el.style.fontFamily = `${input.apply}`;
  });
})();