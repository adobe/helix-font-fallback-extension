import findFallbackFont from './font.js';

const findForAll = async () => {

  const fonts = {};
  document.fonts.forEach((f) => { fonts[f.family] = f;});

  const fallbacks = [];
  for (const font in fonts) {
    try {
      fallbacks.push(findFallbackFont(font, fonts[font].category), document);
    } catch (e) {
      console.log(e);
    }
  }

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