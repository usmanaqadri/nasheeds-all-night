import { sanitizeArabic } from "./sanitizeArabic";

export const slideshowLayoutOptions = [
  "arab-rom-eng",
  "arab-eng",
  "arab-rom",
  "arab",
];

const idOf = (value) => String(value ?? "");
const makeId = () =>
  `slide-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const getMaps = (nasheed) => ({
  stanzas: new Map((nasheed?.stanzas || []).map((s) => [idOf(s._id), s])),
  refrains: new Map((nasheed?.refrains || []).map((r) => [idOf(r._id), r])),
});

// Resolve a V2 sequence occurrence to its source lines, preserving source order.
const sourceLinesForOccurrence = (item, maps) => {
  if (item.type === "stanza") {
    return maps.stanzas.get(idOf(item.stanzaId))?.lines || [];
  }
  if (item.type === "refrain") {
    const refrain = maps.refrains.get(idOf(item.refrainId));
    if (!refrain) return [];
    const lines = maps.stanzas.get(idOf(refrain.stanzaId))?.lines || [];
    // Existing V2 convention: [] means all source-stanza lines.
    if (!refrain.lineIds?.length) return lines;
    const allowed = new Set(refrain.lineIds.map(idOf));
    return lines.filter((line) => allowed.has(idOf(line._id)));
  }
  return [];
};

// Create independent slideshow blocks from the original performance sequence.
// Repeated refrain occurrences become separate blocks with separate line selections.
export const buildBlocksFromNasheedV2 = (nasheed) => {
  const maps = getMaps(nasheed);
  return (nasheed?.sequence || []).flatMap((item) => {
    if (item.type !== "stanza" && item.type !== "refrain") return [];
    const lines = sourceLinesForOccurrence(item, maps);
    if (!lines.length) return [];
    return [
      {
        id: makeId(),
        type: item.type,
        ...(item.type === "stanza"
          ? { stanzaId: idOf(item.stanzaId) }
          : { refrainId: idOf(item.refrainId) }),
        lineIds: lines.map((line) => idOf(line._id)),
      },
    ];
  });
};

// Resolve a customized slideshow block in exactly the order of its lineIds.
// Missing/deleted source lines are skipped; callers can flag them for repair.
export const resolveSlideshowBlock = (block, nasheed) => {
  const maps = getMaps(nasheed);
  const available = sourceLinesForOccurrence(block, maps);
  const byId = new Map(available.map((line) => [idOf(line._id), line]));
  return (block.lineIds || []).flatMap((lineId, lineIndex) => {
    const line = byId.get(idOf(lineId));
    if (!line) return [];
    return [
      {
        lineId: idOf(line._id),
        lineIndex,
        arab: sanitizeArabic(line.arab) || "",
        rom: line.rom || "",
        eng: line.eng || "",
      },
    ];
  });
};

export const resolveSlideshowBlocks = (blocks = [], nasheed) =>
  blocks
    .flatMap((block, blockIndex) =>
      resolveSlideshowBlock(block, nasheed).map((line) => ({
        ...line,
        blockId: idOf(block.id || block._id),
        blockIndex,
        blockType: block.type,
        verseNumber: 0, // assigned below after flattening
      })),
    )
    .map((line, index) => ({ ...line, verseNumber: index + 1 }));

export const hydrateSlides = (slides = [], nasheedMap = {}) =>
  slides.map((slide) => {
    if (slide.type === "custom") {
      return {
        id: idOf(slide.id || slide._id),
        type: "custom",
        title: slide.title || "",
        showTitleIntro: false,
        lines: (slide.lines || []).map((line) => ({
          _id: idOf(line._id || line.id),
          arab: sanitizeArabic(line.arab) || "",
          rom: line.rom || "",
          eng: line.eng || "",
        })),
        verses: [],
      };
    }
    const nasheed = nasheedMap[idOf(slide.nasheedId)];
    const blocks = (slide.blocks || []).map((block) => ({
      id: idOf(block.id || block._id) || makeId(),
      type: block.type,
      ...(block.type === "stanza"
        ? { stanzaId: idOf(block.stanzaId) }
        : { refrainId: idOf(block.refrainId) }),
      lineIds: (block.lineIds || []).map(idOf),
    }));
    return {
      id: idOf(slide.id || slide._id) || makeId(),
      type: "nasheed",
      nasheedId: idOf(slide.nasheedId),
      engTitle: nasheed?.engTitle || slide.engTitle || "Unavailable nasheed",
      arabTitle:
        sanitizeArabic(nasheed?.arabTitle) ||
        sanitizeArabic(slide.arabTitle) ||
        "",
      layout: slide.layout || "arab-rom-eng",
      blocks,
      showTitleIntro: Boolean(slide.showTitleIntro),
      missingNasheed: !nasheed,
      verses: nasheed ? resolveSlideshowBlocks(blocks, nasheed) : [],
    };
  });

export const buildSlideshowPayload = ({ title, slides, creatorId }) => ({
  title: title.trim(),
  creatorId,
  slides: slides.map((slide) =>
    slide.type === "custom"
      ? {
          type: "custom",
          title: (slide.title || "").trim(),
          lines: (slide.lines || []).map((line) => ({
            arab: sanitizeArabic(line.arab) || "",
            rom: line.rom || "",
            eng: line.eng || "",
          })),
        }
      : {
          type: "nasheed",
          nasheedId: idOf(slide.nasheedId),
          layout: slide.layout || "arab-rom-eng",
          showTitleIntro: Boolean(slide.showTitleIntro),
          blocks: (slide.blocks || []).map((block) => ({
            type: block.type,
            ...(block.type === "stanza"
              ? { stanzaId: idOf(block.stanzaId) }
              : { refrainId: idOf(block.refrainId) }),
            lineIds: (block.lineIds || []).map(idOf),
          })),
        },
  ),
});

export const buildSlideshowModalData = (slideshow, nasheedMap = {}) => {
  const hydratedSlides = hydrateSlides(slideshow.slides || [], nasheedMap);
  const verses = hydratedSlides.flatMap((slide) => slide.verses);
  return {
    _id: slideshow._id,
    type: "slideshow",
    engTitle: slideshow.title,
    arabTitle: "Slideshow",
    subtitle: `${hydratedSlides.length} item${hydratedSlides.length === 1 ? "" : "s"}`,
    creatorId: slideshow.creatorId,
    arab: verses.map((verse) => sanitizeArabic(verse.arab)),
    rom: verses.map((verse) => verse.rom),
    eng: verses.map((verse) => verse.eng),
    footnotes: [],
    slides: hydratedSlides.map((slide, index) => ({
      ...slide,
      order: index + 1,
    })),
  };
};
