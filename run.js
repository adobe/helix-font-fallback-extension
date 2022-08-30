import { findFallbackFont } from 'js/logic/fonts.js';

(() => {
  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await callback(array[index], index, array);
    }
  };

  const findForAll = async () => {

    const fonts = {};
    document.fonts.forEach((f) => { fonts[f.family] = f;});

    const fallbacks = [];
    await asyncForEach(Object.keys(fonts), async (font) => {
      if (!font.family.includes('fallback')) {
        try {
          const fallback = window.prompt(`What is the default font to use as basis for ${font}?`, 'Arial')
          fallbacks.push(await findFallbackFont({ family: font, fallback }));
        } catch (e) {
          console.log(e);
        }
      }
    });

    return fallbacks;
  }

  const main = async () => {
    const fallbacks = await findForAll();

    console.log('Here are your fallbacks:');
    fallbacks.forEach((f) => {
      console.log(`@font-face {
    font-family: "${f.font}-fallback";
    size-adjust: ${f.adjust}%;
    src: local("${f.fallback}");
    }`);
    });
  };

  main();
})();