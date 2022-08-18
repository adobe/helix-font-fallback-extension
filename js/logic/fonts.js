const TEXT = 'Where does it come from? Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.';
const MAX_STEPS = 1000;
const ADJUST_START = 100;
const STEP_START = 0.1;
const PROPERTY = 'offsetWidth';

const findFallbackFont = async (font, weight, fallback) => {
  console.log(`Attempt to find fallback for font ${font}`);

  const el = document.createElement('p');
  document.body.append(el);

  el.innerHTML = TEXT;
  el.style['white-space'] = 'pre';
  el.style['display'] = 'inline-block';

  el.style['font-family'] = font;
  el.style['font-weight'] = weight;

  const initial = el[PROPERTY];
  
  console.log(`Initial value for property ${PROPERTY}: ${initial}`);

  const fallbackFont = `${font}-${weight}-fallback`;
  el.style['font-family'] = fallbackFont;
  
  let steps = 0;
  let adjust = ADJUST_START;
  let step = STEP_START;
  // step1 is necessary to avoid extra decimals...
  let step1 = 1 / step;
  let diff = 0;

  const diffs = [];
  const adjusts = [];

  do {
    // console.log(`Trying with adjust: ${adjust}`);
    const font = new FontFace(fallbackFont, `local("${fallback}")`, { sizeAdjust: `${adjust}%`, weight });
    await font.load();
    document.fonts.add(font);

    // console.log(`Values (current / initial): ${el[PROPERTY]} / ${initial}`);
    diff = el[PROPERTY] - initial;

    // document.fonts.delete(font);

    if (diff === 0) break;
    
    if (diff > 0) {
      if (diffs.length > 1 && diffs[diffs.length - 1] < diff) {
        // sign changed, need to reduce step size
        step = step / 10;
        step1 = 1 / step;
        console.log(`Adjusting step (minus): ${step}`);
        adjust = ((adjusts[adjusts.length - 1] * step1 ) - (step * step1)) / step1;
      } else {
        adjust = ((adjust * step1) - (step * step1)) / step1;
      }
    } else {
      if (diffs.length > 1 && diffs[diffs.length - 1] > diff) {
        // sign changed, need to reduce step size
        step = step / 10;
        step1 = 1 / step;
        console.log(`Adjusting step (plus): ${step}`);
        adjust = ((adjusts[adjusts.length - 1] * step1 ) + (step * step1)) / step1;
      } else {
        adjust = ((adjust * step1) + (step * step1)) / step1;
      }
    }
    
    diffs.push(diff);
    adjusts.push(adjust);

    steps++;

  } while (steps < MAX_STEPS && step > 0.001);

  el.remove();

  if (steps < MAX_STEPS) {
    return {
      font,
      fallback,
      adjust,
      steps,
      name: fallbackFont
    };
  }
  throw new Error(`Could not find font adjust for "${font}": ${adjust} (${el[PROPERTY]} / ${initial})`);
}

const getFontFaceOutput = (family, weight, newname, adjust, fallback) => {
  return `
  /* fallback font for ${family} (${weight}) */
  @font-face {
    font-family: "${newname}";
    size-adjust: ${adjust}%;
    src: local("${fallback}");
  };\n`;
}

const getElementsUsingFont = (family, weight = null) => {
  console.log(`Searching for elements using font ${family} (${weight})`);
  const elements = [];

  const familyLC = family.toLowerCase().trim()
  document.querySelectorAll('*').forEach(function(el) {
    const currentFamily = window.getComputedStyle(el).getPropertyValue('font-family').toLowerCase().trim();
    const currentWeight = window.getComputedStyle(el).getPropertyValue('font-weight');

    if (currentFamily.includes(familyLC)) {
      if (weight === null || weight === currentWeight) {
        elements.push(el);
      }
    }
  });

  console.log(`Found ${elements.length} elements.`, elements);
  return elements;
}

export { findFallbackFont, getFontFaceOutput, getElementsUsingFont };