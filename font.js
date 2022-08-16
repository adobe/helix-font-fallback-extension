// config
const TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tortor purus, vulputate non euismod vitae, porttitor vitae leo. Sed ornare posuere ex in porttitor. Nunc tempor mollis ipsum, a fringilla lectus consequat nec. Morbi vitae bibendum dolor, sit amet commodo purus. Quisque volutpat a tellus ut lacinia. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla gravida malesuada libero sed ullamcorper. Nam et vestibulum lacus. Donec blandit est a tempor eleifend. Nullam non diam lobortis, lacinia lorem nec, lacinia arcu.';
const MAX_STEPS = 1000;
const ADJUST_START = 100;
const STEP_START = 0.1;
const PROPERTY = 'offsetWidth';

export default (font, category, document) => {
  console.log(`Attempt to find fallback for font ${font}`);

  const el = document.createElement('p');
  document.body.append(el);

  el.innerHTML = TEXT;
  el.style['white-space'] = 'pre';
  el.style['display'] = 'inline-block';

  el.style['font-family'] = font;

  const initial = el[PROPERTY];
  console.log('initial: ' + initial);

  el.style['font-family'] = 'fallbackfont';
  
  let steps = 0;
  let adjust = ADJUST_START;
  let step = STEP_START;
  // step1 is necessary to avoid extra decimals...
  let step1 = 1 / step;
  let diff = 0;

  const diffs = [];
  const adjusts = [];

  const fallback = 'Arial';
  if (category === 'serif') {
    fallback = 'Times New Roman';
  }

  do {
    // console.log(`Trying with adjust: ${adjust}`);
    const font = new FontFace('fallbackfont', `local("${fallback}")`, { sizeAdjust: `${adjust}%` });
    await font.load();
    document.fonts.add(font);

    //console.log(`Values (current / initial): ${el[property]} / ${initial}`);
    diff = el[PROPERTY] - initial;

    if (diff === 0) break;
    
    if (diff > 0) {
      if (diffs.length > 1 && diffs[diffs.length - 1] < diff) {
        // sign changed, need to reduce step size
        step = step / 10;
        step1 = 1 / step;
        console.log(`Adjusting step (minus): ${step} / ${step1}`);
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
    };
  }
  throw new Error(`Could not find font adjust for "${font}": ${adjust} (${el[PROPERTY]} / ${initial})`);
}