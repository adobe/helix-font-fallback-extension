# Font fallback

Chrome extension (and some utils) that computes a fallback font for all the fonts used on a page - this is helper to preserve the [CLS](https://web.dev/cls/).

Detailled explanations: https://www.industrialempathy.com/posts/high-performance-web-font-loading/
The code is inspired from https://www.industrialempathy.com/perfect-ish-font-fallback/?font=Montserrat and https://github.com/googlefonts/cls_calculator

The Font fallback tool analyses the fonts on the current page and for each custom font can generate a font fallback for you. A font fallback is a browser standard font (like Arial) which requires no loading time, plus a size adjustment percentage which is computed to size the standard font to approximate the custom font. Like this, when the custom font is loaded, it can smoothly replace the standard font with no CLS, i.e. with no impact on the layout.

## Usage

### Compute the font fallback

#### With the Chrome extension

Install the extension from the Google Store: https://chrome.google.com/webstore/detail/helix-font-fallback/deceeoanicnkoieibbfellglginplfbm?hl=en

#### With an unpacked Chrome extension

Useful for development too.

```
git clone https://github.com/adobe/helix-font-fallback-extension
```

Load the extension as an local unpacked extension - see [instructions here](https://developer.chrome.com/docs/extensions/mv3/getstarted/#unpacked)

#### With the bookmarklet

For developers.
Add the following bookmarklet to your browser:

```js
javascript: (() => {
  const s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://main--helix-font-fallback-extension--adobe.aem.live/src/bookmarklet.js';
  document.head.append(s);
})();
```

On any website, run the bookmarklet and check the console for the output. The generated fontfaces can be used as fallback font until the real font is loaded and still preserve the [CLS](https://web.dev/cls/).

### Use the font fallback

Using one of the 3 methods above, you will get some css. Example:

```css
/* fallback font for adobe-clean (normal - 400) */
@font-face {
  font-family: "adobe-clean-normal-400-fallback";
  size-adjust: 90.129%;
  src: local("Arial");
}

/* fallback font for adobe-clean (normal - 700) */
@font-face {
  font-family: "adobe-clean-normal-700-fallback";
  size-adjust: 93.939%;
  src: local("Arial");
}
```

These 2 fallback fonts are based on Arial for the Adobe Clean font (weight 400 and 700).

Paste this CSS at the beginning of your main CSS.

Add the fallback fonts to the font family of your body tag (or any element requiring the font - weight 400) and / or your headings (weight 700), something like:

```css
body {
  font-family: Adobe Clean, "adobe-clean-normal-400-fallback";
}

h1, h2, h3, h4, h5, h6 {
  font-family: Adobe Clean, "adobe-clean-normal-700-fallback";
}
```

Once your page loads, the browser may not find the `Adobe Clean` font immediately, thus it uses the fallback fonts (= re-sized `Arial`). You can now defer the load of your Adobe Clean font (and not block your page loading sequence). Once loaded, browser will use them. The swap of the fonts will not cause any CLS problem because the 2 fonts have approximatively the same size.

See the [#Takeaways from project](https://github.com/adobe/helix-font-fallback-extension/edit/main/README.md#takeaways-from-project) below to understand the limits.

## Tools

### Font Fallback simulator

https://main--helix-font-fallback-extension--adobe.aem.live/tools/simulator/index.html

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

https://main--helix-font-fallback-extension--adobe.aem.live/tools/generator/index.html

The Font Fallback generator exposes the same logic that runs behind the Chrome extension or the bookmarklet. Only difference here is that you have to specify the entry parameters manually.
It is useful to test the font fallback computation with different fonts or especially on a diffent text: the length of the text and the character instances used have a direct impact on the `size-adjust` that will be computed - you can here specify your own text (most likely the one you have on your website).

Form parameters:

- `Font Family`: the name of the font you need a fallback for (typically your website nice and non standard font)
- `CSS with Font URL`: the URL of a CSS file to load the font from
- `Local Font fallback`: the standard local font fallback that will be used util the non standard font is loaded
- `Text Line Height`: the text line height you are using
- `Text`: the text used to compute the font fallback.

## Takeaways from project

### The algorithm

The algorithm is pretty straight forward. For a given paragraph:

1. make sure it stays on one line (`display: inline-block` and `white-space: pre`)
2. apply the font and measure its width with the current font
3. apply the fallback back font (one known by the browser) and measure its with 
4. try different `size-adjust` on the font until you get the same width

### Text content matters

It might be obvious (was not to me) but the text to run the font fallback computation on really matters. It is not necessarily its length but rather the combo of characters used: each character has a different width thus depending on the number of instances of each of them you might end up with a different size adjustment for the fallback font.

### Height does not really matters

If the paragraph (or heading or list items...) is an fixed width container, the text might go the next line and push down the next elements. Similar to the previous point, it highly depends on the text and the character instances used to compute the size adjustement. Except if you have a huge parapraph, the probability is also lower and we can consider to ignore the height during the computation. If this is an issue, you should probably tweak the font fallback on the exact text used (most likely decrease the size adjust to reduce the number of extra lines created).
If the container width is small but there is a lot of text and spacing, this can be tricky.

### Family, style and weight

The font world is pretty complex and looking at many websites, each front end developer or designer will manage the fonts and how they use them differently. This extension focuses on the font family combined with the font style (normal, italic...) and weight (100 to 900) to compute a fallback font face per combination. But there might be other dimensions, especially the unicode range. Font makers tend to group the unicode ranges together and generate different font faces with different ranges. One example:

https://fonts.apis.com/css2?family=Montserrat gives you 5 font faces for one family, style and weight combo (Montserrat, normal, 400). Creating a font face fallback for each of them will generate a huge number of font faces. 

The extension performs the computation only on the font faces with `status === "loaded"`. On average, a webpage seems to be using less than 10% of the font faces it is asked to load!

Another example: https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,400;1,400 - Fire Sans with normal and italic style for a 400 weight. This CSS generates 14 font faces. On a English website, only 2 of those might be really useful. Here the extension will probably only compute 2 fallbacks.
