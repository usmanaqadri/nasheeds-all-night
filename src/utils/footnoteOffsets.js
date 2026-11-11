/**
 * Transforms footnote ranges after an English translation edit.
 *
 * Ranges use [start, end) indexing:
 * start inclusive, end exclusive.
 *
 * Offsets are JavaScript string offsets (UTF-16).
 */

function findChange(oldText, newText) {
  let start = 0;

  while (
    start < oldText.length &&
    start < newText.length &&
    oldText[start] === newText[start]
  ) {
    start++;
  }

  let oldEnd = oldText.length;
  let newEnd = newText.length;

  while (
    oldEnd > start &&
    newEnd > start &&
    oldText[oldEnd - 1] === newText[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }

  return {
    start,
    oldEnd,
    newEnd,
    delta: newEnd - start - (oldEnd - start),
  };
}

function transformRange(range, change) {
  const [start, end] = range;
  const { start: editStart, oldEnd, newEnd, delta } = change;

  // Insertion without deletion
  if (editStart === oldEnd) {
    const insertedLength = newEnd - editStart;

    if (editStart <= start) {
      return [start + insertedLength, end + insertedLength];
    }

    if (editStart < end) {
      return [start, end + insertedLength];
    }

    return [start, end];
  }

  // Replacement or deletion
  const mapStart = (position) => {
    if (position < editStart) return position;
    if (position >= oldEnd) return position + delta;
    return editStart;
  };

  const mapEnd = (position) => {
    if (position <= editStart) return position;
    if (position >= oldEnd) return position + delta;
    return newEnd;
  };

  return [mapStart(start), mapEnd(end)];
}

export function updateFootnotesForTextChange(
  footnotes,
  lineId,
  oldText,
  newText,
) {
  if (oldText === newText) return footnotes;

  const change = findChange(oldText, newText);

  return footnotes.map((note) => {
    if (String(note.lineId) !== String(lineId)) {
      return note;
    }

    if (!Array.isArray(note.range)) {
      return note;
    }

    const range = transformRange(note.range, change);

    const start = Math.max(0, Math.min(range[0], newText.length));

    const end = Math.max(start, Math.min(range[1], newText.length));

    return {
      ...note,
      range: [start, end],
    };
  });
}
