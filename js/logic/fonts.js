const TEXT = 'Where does it come from? Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32. The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.';
const MAX_STEPS = 1000;
const ADJUST_START = 100;
const STEP_START = 0.1;

const findFallbackFont = async ({ family, local, element: el, removeElement = true, property = 'offsetWidth'}) => {
  console.log(`Attempt to find fallback for font ${family}`);

  if (!el) {
    el = document.createElement('p');
    document.body.append(el);
    el.innerHTML = TEXT;
    el.style['white-space'] = 'pre';
    el.style['display'] = 'inline-block';
  }

  el.style['font-family'] = `"${family}"`;

  const initial = el[property];
  
  console.log(`Initial value for property ${property}: ${initial}`);

  const fallbackFont = `${family}-fallback`;
  el.style['font-family'] = `"${fallbackFont}"`;
  
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
    const fontface = new FontFace(fallbackFont, `local("${local}")`, { sizeAdjust: `${adjust}%` });
    await fontface.load();
    document.fonts.add(fontface);

    // console.log(`Values (current / initial): ${el[property]} / ${initial}`);
    diff = el[property] - initial;

    // document.fonts.delete(font);

    if (diff === 0) break;
    
    if (diff > 0) {
      if (diffs.length > 1 && diffs[diffs.length - 1] < diff) {
        // sign changed, need to reduce step size
        step = step / 10;
        step1 = 1 / step;
        // console.log(`Adjusting step (minus): ${step}`);
        adjust = ((adjusts[adjusts.length - 1] * step1 ) - (step * step1)) / step1;
      } else {
        adjust = ((adjust * step1) - (step * step1)) / step1;
      }
    } else {
      if (diffs.length > 1 && diffs[diffs.length - 1] > diff) {
        // sign changed, need to reduce step size
        step = step / 10;
        step1 = 1 / step;
        // console.log(`Adjusting step (plus): ${step}`);
        adjust = ((adjusts[adjusts.length - 1] * step1 ) + (step * step1)) / step1;
      } else {
        adjust = ((adjust * step1) + (step * step1)) / step1;
      }
    }
    
    diffs.push(diff);
    adjusts.push(adjust);

    steps++;

  } while (steps < MAX_STEPS && step > 0.001);

  if (removeElement) {
    el.remove();
  }

  if (steps < MAX_STEPS) {
    return {
      local,
      adjust,
      steps,
      name: fallbackFont
    };
  }
  throw new Error(`Could not find font adjust for "${family}": ${adjust} (${el[PROPERTY]} / ${initial})`);
}

const getFontFaceOutput = (family, { name, adjust, local }) => {
  return `
  /* fallback font for ${family} */
  @font-face {
    font-family: "${name}";
    size-adjust: ${adjust}%;
    src: local("${local}");
  }\n`;
}

const getElementsUsingFont = (family) => {
  console.log(`Searching for elements using font ${family}`);
  const elements = [];

  const familyLC = family.toLowerCase().trim()
  document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a, li, span').forEach(function(el) {
    const currentFamily = window.getComputedStyle(el).getPropertyValue('font-family').toLowerCase().trim();

    if (currentFamily.includes(familyLC)) {
      elements.push(el);
    }
  });

  console.log(`Found ${elements.length} elements.`, elements);
  return elements;
}

export { findFallbackFont, getFontFaceOutput, getElementsUsingFont };