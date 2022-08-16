const findFallbacks = async () => {
  // config
  const TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tortor purus, vulputate non euismod vitae, porttitor vitae leo. Sed ornare posuere ex in porttitor. Nunc tempor mollis ipsum, a fringilla lectus consequat nec. Morbi vitae bibendum dolor, sit amet commodo purus. Quisque volutpat a tellus ut lacinia. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla gravida malesuada libero sed ullamcorper. Nam et vestibulum lacus. Donec blandit est a tempor eleifend. Nullam non diam lobortis, lacinia lorem nec, lacinia arcu.';
  const MAX_STEPS = 1000;
  const ADJUST_START = 100;
  const STEP_START = 0.1;
  const property = 'offsetWidth';

  const fonts = {};
  document.fonts.forEach((f) => { fonts[f.family] = f;});

  const el = document.createElement('p');
  document.body.append(el);

  el.innerHTML = TEXT;
  el.style['white-space'] = 'pre';
  el.style['display'] = 'inline-block';

  const fallbacks = [];
  for (const font in fonts) {
    console.log(`Attempt to find fallback for font ${font}`);
    el.style['font-family'] = font;

    const initial = el[property];
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
    if (fonts[font].category === 'serif') {
      fallback = 'Times New Roman';
    }

    do {
      // console.log(`Trying with adjust: ${adjust}`);
      const font = new FontFace('fallbackfont', `local("${fallback}")`, { sizeAdjust: `${adjust}%` });
      await font.load();
      document.fonts.add(font);

      //console.log(`Values (current / initial): ${el[property]} / ${initial}`);
      diff = el[property] - initial;

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

    if (steps < MAX_STEPS) {
      fallbacks.push({
        font,
        fallback,
        adjust,
        steps,
      });

      console.log(`Found an adjust at: ${adjust} (${el[property]} / ${initial}). Nb of steps: ${steps}.`);
    } else {
      console.error(`Could not adjust font ${font}: ${adjust} (${el[property]} / ${initial})`);
    }
  }

  el.remove();

  return fallbacks;
}

const fallbacks = await findFallbacks();

console.log('Here are your fallbacks:');
fallbacks.forEach((f) => {
  console.log(`@font-face {
font-family: "${f.font}-fallback";
size-adjust: ${f.adjust}%;
src: local("${f.fallback}");
}`);
});