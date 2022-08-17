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