# Font fallback

Computes the fallback font for all the fonts used on a page in order to preserve the [CLS](https://web.dev/cls/).

Detailled explanations: https://www.industrialempathy.com/posts/high-performance-web-font-loading/
Code is inspired from https://www.industrialempathy.com/perfect-ish-font-fallback/?font=Montserrat

## Usage

### As a Chrome extension

```
git clone https://github.com/kptdobe/font-fallback
```

Load the extension as an local unpacked extension - see [instructions here](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked)

### As a bookmarklet
Add the following bookmarklet to your browser:

```js
javascript: (() => {
  const s = document.createElement('script');
  s.src='https://main--font-fallback--kptdobe.hlx.live/run.js';
  document.head.append(s);
})();
```

On any website, run the bookmarklet and check the console for the output. The generated fontfaces can be used as fallback font until the real font is loaded and still preserve the [CLS](https://web.dev/cls/).

## Take aways from project

This project is highly inspired from the work done here: https://www.industrialempathy.com/posts/high-performance-web-font-loading/.

### The algorithm

The algorithm is pretty straight forward. For a given paragraph:

1. make sure it stays on one line (`display: inline-block` and `white-space: pre`)
2. apply the font and measure its width with the current font
3. apply the fallback back font (one known by the browser) and measure its with 
4. try different `size-adjust` on the font until you get the same width

### Text content matters

It might be obvious (was not to me) but the text to run the font fallback computation on really matters. It is not necessarily its length but rather the combo of characters used: each character has a different width thus depending on the number of instances of each of them you might end up with a different size adjustment for the fallback font.

### Height does not really matters

If the paragraph (or heading or list items...) is an fixed width container, the text might go the next line and push down the next elements. Similar to the previous point, it highly depends on the text and the character instances used to compute the size adjustement. Except if you have a huge parapraph, the probably is also lower and we can consider to ignore the height during the computation. If this is an issue, you should probably tweak the font fallback on the exact text used (most likely decrease the size adjust to reduce the number of extra lines created).
If the container width is small but there is a lot of text and spacing, this can be tricky.
