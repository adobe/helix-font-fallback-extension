(() => {
  // config
  const TEXT = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In tortor purus, vulputate non euismod vitae, porttitor vitae leo. Sed ornare posuere ex in porttitor. Nunc tempor mollis ipsum, a fringilla lectus consequat nec. Morbi vitae bibendum dolor, sit amet commodo purus. Quisque volutpat a tellus ut lacinia. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nulla gravida malesuada libero sed ullamcorper. Nam et vestibulum lacus. Donec blandit est a tempor eleifend. Nullam non diam lobortis, lacinia lorem nec, lacinia arcu.';
  const MAX_STEPS = 1000;
  const ADJUST_START = 100;
  const STEP_START = 0.1;
  const PROPERTY = 'offsetWidth';

  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await callback(array[index], index, array);
    }
  };

  const findFallbackFont = async (font, fallback, document) => {
    console.log(`Attempt to find fallback for font ${font}`);

    const el = document.createElement('p');
    document.body.append(el);

    el.innerHTML = TEXT;
    el.style['white-space'] = 'pre';
    el.style['display'] = 'inline-block';

    el.style['font-family'] = `"${font}"`;

    const initial = el[PROPERTY];
    console.log('initial: ' + initial);

    const fallbackFont = `${font}-fallback`;
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
      const font = new FontFace(fallbackFont, `local("${fallback}")`, { sizeAdjust: `${adjust}%` });
      await font.load();
      document.fonts.add(font);

      // console.log(`Values (current / initial): ${el[PROPERTY]} / ${initial}`);
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

  const findForAll = async () => {

    const fonts = {};
    document.fonts.forEach((f) => { fonts[f.family] = f;});

    const fallbacks = [];
    await asyncForEach(Object.keys(fonts), async (font) => {
      try {
        const fallback = window.prompt(`What is the default font to use as basis for ${font}?`, 'Arial')
        fallbacks.push(await findFallbackFont(font, fallback, document));
      } catch (e) {
        console.log(e);
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