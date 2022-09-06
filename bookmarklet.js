import { computeFallbackFont } from './js/logic/fonts.js';

(() => {
  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await callback(array[index], index, array);
    }
  };

  const findForAll = async () => {

    const fonts = [];
    document.fonts.forEach((f) => { 
      if (!fonts.includes(f.family)) {
        fonts.push(f.family);
      }
    });

    const fallbacks = [];
    await asyncForEach(fonts, async (font) => {
      if (!font.includes('fallback')) {
        try {
          const local = window.prompt(`What is the default / local font to use as basis for ${font}?`, 'Arial');
          if (local) {
            fallbacks.push(await computeFallbackFont({ family: font, local }));
          }
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
    font-family: "${f.name}";
    size-adjust: ${f.adjust}%;
    src: local("${f.local}");
}`);
    });
  };

  main();
})();