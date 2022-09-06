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
  s.type = 'module';
  s.src = 'https://main--font-fallback--kptdobe.hlx.live/bookmarklet.js';
  document.head.append(s);
})();
```

On any website, run the bookmarklet and check the console for the output. The generated fontfaces can be used as fallback font until the real font is loaded and still preserve the [CLS](https://web.dev/cls/).

## Tools

### Font Fallback simulator

https://main--font-fallback--kptdobe.hlx.live/tools/simulator/index.html

The Font Fallback simulator allows you the preview a font fallback "in action" and visualize the CLS that the real font loading would introduce. In the end, the CLS must be 0.
The tool is usefull to fine tune the `size-adjust`, be more precise and to preview the CLS. From the preview window, you can directly go to the [PageSpeed insights](https://pagespeed.web.dev/report) report with your config. It should give you a more accurate CLS measurement.

Form parameters:

- `Font Family`: the name of the font you need a fallback for (typically your website nice and non standard font)
- `CSS with Font URL`: the URL of a CSS file to load the font from
- `Local Font fallback`: the standard local font fallback that will be used util the non standard font is loaded
- `Font Size Adjust`: the font size-adjust you want to apply to the fallback font
- `Text Line Height`: the text line height you are using
- `Body Width`: default to 100% body width but in some cases, you want to preview the fallback font behavior in the context of a fixed width container. You can specify any css `width` property (like `500px`)

### Font Fallback generator

https://main--font-fallback--kptdobe.hlx.live/tools/simulator/generator.html

The Font Fallback generator exposes the same logic that runs behind the Chrome extension or the bookmarklet. Only difference here is that you have to specify the entry parameters manually.
It is useful to test the font fallback computation with different fonts or especially on a diffent text: the length of the text and the character instances used have a direct impact on the `size-adjust` that will be computed - you can here specify your own text (most likely the one you have on your website).

Form parameters:

- `Font Family`: the name of the font you need a fallback for (typically your website nice and non standard font)
- `CSS with Font URL`: the URL of a CSS file to load the font from
- `Local Font fallback`: the standard local font fallback that will be used util the non standard font is loaded
- `Text Line Height`: the text line height you are using
- `Text`: the text used to compute the font fallback.

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

# Weight or not weight

The font weight definitively has an impact on the "space" that the font occupies. But... the weight might be managed with a different font face and finding a fallback for all weights of a font can be tricky. For example, Arial offers 400 and 700 but you might want to use Arial Black font for a weight of 900. Having a generic rule or a tool that allows all the possible config here is not simple. We'll focus here only on the family, not the weight.