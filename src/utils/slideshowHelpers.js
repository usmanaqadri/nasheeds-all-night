export const slideshowLayoutOptions = [
  "arab-rom-eng",
  "arab-eng",
  "arab-rom",
  "arab",
];

export const buildVerseIndexesFromRange = (startVerse, endVerse) =>
  Array.from(
    { length: endVerse - startVerse + 1 },
    (_, index) => startVerse - 1 + index
  );

export const getRangeFromVerseIndexes = (verseIndexes = []) => {
  if (!verseIndexes.length) {
    return { startVerse: 1, endVerse: 1 };
  }

  const sorted = [...verseIndexes].sort((a, b) => a - b);

  return {
    startVerse: sorted[0] + 1,
    endVerse: sorted[sorted.length - 1] + 1,
  };
};

export const hydrateSlides = (slides = [], nasheedMap = {}) =>
  slides
    .map((slide, index) => {
      const nasheed = nasheedMap[slide.nasheedId];

      if (!nasheed) {
        return null;
      }

      const verseIndexes = [...(slide.verseIndexes || [])].sort((a, b) => a - b);
      const { startVerse, endVerse } = getRangeFromVerseIndexes(verseIndexes);

      return {
        id: slide._id || `${slide.nasheedId}-${index}`,
        nasheedId: slide.nasheedId,
        engTitle: nasheed.engTitle,
        arabTitle: nasheed.arabTitle,
        startVerse,
        endVerse,
        layout: slide.layout || "arab-rom-eng",
        verseIndexes,
        verses: verseIndexes.map((verseIndex) => ({
          verseNumber: verseIndex + 1,
          arab: nasheed.arab[verseIndex],
          rom: nasheed.rom[verseIndex],
          eng: nasheed.eng[verseIndex],
        })),
      };
    })
    .filter(Boolean);

export const buildSlideshowPayload = ({ title, slides, creatorId }) => ({
  title: title.trim(),
  creatorId,
  slides: slides.map((slide) => ({
    nasheedId: slide.nasheedId,
    verseIndexes: buildVerseIndexesFromRange(slide.startVerse, slide.endVerse),
    layout: slide.layout || "arab-rom-eng",
  })),
});

export const buildSlideshowModalData = (slideshow, nasheedMap = {}) => {
  const hydratedSlides = hydrateSlides(slideshow.slides, nasheedMap);
  const flattenedVerses = hydratedSlides.flatMap((slide) => slide.verses);

  return {
    _id: slideshow._id,
    type: "slideshow",
    engTitle: slideshow.title,
    arabTitle: "Slideshow",
    subtitle: `${hydratedSlides.length} slide${hydratedSlides.length === 1 ? "" : "s"}`,
    creatorId: slideshow.creatorId,
    arab: flattenedVerses.map((verse) => verse.arab),
    rom: flattenedVerses.map((verse) => verse.rom),
    eng: flattenedVerses.map((verse) => verse.eng),
    footnotes: [],
    slides: hydratedSlides.map((slide, index) => ({
      order: index + 1,
      engTitle: slide.engTitle,
      arabTitle: slide.arabTitle,
      startVerse: slide.startVerse,
      endVerse: slide.endVerse,
      verseIndexes: slide.verseIndexes,
      layout: slide.layout,
      verses: slide.verses,
    })),
  };
};
