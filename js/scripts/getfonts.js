{
  const unique = new Set();

  // return array of fonts
  Array
    .from(document.fonts)
    .map(font => {
      const id = font.family;
      if (!unique.has(id) && !font.family.includes('fallback')) {
        unique.add(id);
        return { 
          family: font.family,
        };
      }
      return null;
    })
    .filter((font) => font !== null)
    .sort((a, b) => a.family.localeCompare(b.family));
}