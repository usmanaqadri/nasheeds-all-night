export function getNasheedSlides(nasheed) {
  if (!nasheed) return [];

  // V1: preserve existing two-line presentation behavior
  if (nasheed.schemaVersion !== 2) {
    const slides = [];

    for (let i = 0; i < (nasheed.eng || []).length; i += 2) {
      const lines = [i, i + 1]
        .filter((index) => index < nasheed.eng.length)
        .map((index) => ({
          _id: String(index),
          arab: nasheed.arab?.[index] || "",
          rom: nasheed.rom?.[index] || "",
          eng: nasheed.eng?.[index] || "",
          originalIndex: index,
        }));

      slides.push({
        type: "stanza",
        lines,
      });
    }

    return slides;
  }

  // V2: resolve stanza and refrain references
  const stanzaMap = new Map(
    (nasheed.stanzas || []).map((stanza) => [String(stanza._id), stanza]),
  );

  const refrainMap = new Map(
    (nasheed.refrains || []).map((refrain) => [String(refrain._id), refrain]),
  );

  return (nasheed.sequence || []).map((item) => {
    if (item.type === "stanza") {
      const stanza = stanzaMap.get(String(item.stanzaId));

      if (!stanza) {
        throw new Error(`Missing stanza: ${item.stanzaId}`);
      }

      return {
        type: "stanza",
        stanzaId: String(stanza._id),
        lines: stanza.lines,
      };
    }

    if (item.type === "refrain") {
      const refrain = refrainMap.get(String(item.refrainId));

      if (!refrain) {
        throw new Error(`Missing refrain: ${item.refrainId}`);
      }

      const stanza = stanzaMap.get(String(refrain.stanzaId));

      if (!stanza) {
        throw new Error(`Missing stanza: ${refrain.stanzaId}`);
      }

      const selectedIds = new Set((refrain.lineIds || []).map(String));

      return {
        type: "refrain",
        name: refrain.name,
        refrainId: String(refrain._id),
        lines: selectedIds.size
          ? stanza.lines.filter((line) => selectedIds.has(String(line._id)))
          : stanza.lines,
      };
    }

    throw new Error(`Unknown sequence type: ${item.type}`);
  });
}
