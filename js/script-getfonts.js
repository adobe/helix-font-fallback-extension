{
  const unique = new Set();

  // return array of fonts
  Array
    .from(document.fonts)
    .map(font => {
      const id = font.family + '-' + font.weight;
      if (!unique.has(id)) {
        unique.add(id);
        return { 
          family: font.family,
          weight: font.weight
        };
      }
      return null;
    })
    .filter((font) => font !== null)
    .sort((a, b) => { 
      const i = a.family.localeCompare(b.family);
      if (i === 0) {
        return a.weight - b.weight;
      }
      return i;
    });
}