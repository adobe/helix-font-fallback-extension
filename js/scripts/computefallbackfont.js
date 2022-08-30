(async () => {
  try {

    const src = chrome.runtime.getURL('/js/logic/fonts.js');
    const { findFallbackFont } = await import(src);

    const { input } = await chrome.storage.local.get('input');
    const { family, weight, fallback } = input;
    await chrome.storage.local.remove('input');
    const font = await findFallbackFont({ family, weight, fallback });
    console.log('Computed fallback font: ', font);
    await chrome.storage.local.set({ output: font });
  } catch (e) {
    console.error(e);
    await chrome.storage.local.set({ error: e.message });
  }
})();