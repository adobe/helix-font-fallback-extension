# Font fallback

Computes the fallback font for the fonts used on a page in order to preserve the CLS.

Inspired from https://www.industrialempathy.com/perfect-ish-font-fallback/?font=Moul

## Usage

Add the following bookmarklet to your browser:

```js
javascript: (() => {
  const s = document.createElement('script');
  s.src='https://main--font-fallback--kptdobe.hlx.live/run.js';
  document.head.append(s);
})();
```

On any website, run the bookmarklet and check the console for the output.