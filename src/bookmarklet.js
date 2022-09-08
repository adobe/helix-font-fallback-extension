/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { computeFallbackFont, getFonts, getFontFaceOutput } from './extension/js/shared/fonts.js';

(() => {
  const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      await callback(array[index], index, array);
    }
  };

  const findForAll = async () => {
    const fonts = getFonts();

    const fallbacks = [];
    await asyncForEach(fonts, async (font) => {
      const unique = new Set();
      const {
        status, id,
      } = font;
      if (status === 'loaded' && !unique.has(id)) {
        unique.add(id);
        try {
          // eslint-disable-next-line no-alert
          const local = window.prompt(`What is the default / local font to use as basis for ${font.display}?`, 'Arial');
          if (local) {
            const fallback = await computeFallbackFont({ font, local });
            fallbacks.push({
              font,
              fallback,
            });
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      }
    });

    return fallbacks;
  };

  const main = async () => {
    const fallbacks = await findForAll();

    // eslint-disable-next-line no-console
    console.log('Here are your fallbacks:');
    let out = '';
    fallbacks.forEach((f) => {
      out += getFontFaceOutput(f.font, f.fallback);
    });
    // eslint-disable-next-line no-console
    console.log(out);
  };

  main();
})();
