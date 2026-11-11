import React, { useState } from "react";
import { Popover, Typography, Box } from "@mui/material";

export default function FootnotedTranslation({
  text = "",
  lineId,
  footnotes = [],
  onEditFootnote,
}) {
  const [activeNote, setActiveNote] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const notes = footnotes
    .filter((note) => String(note.lineId) === String(lineId))
    .filter(
      (note) =>
        Array.isArray(note.range) &&
        note.range.length === 2 &&
        note.range[0] >= 0 &&
        note.range[1] <= text.length &&
        note.range[1] > note.range[0],
    )
    .sort((a, b) => a.range[0] - b.range[0]);

  const parts = [];
  let cursor = 0;

  notes.forEach((note, index) => {
    const [start, end] = note.range;

    if (start < cursor) return;

    if (start > cursor) {
      parts.push(
        <React.Fragment key={`text-${index}`}>
          {text.slice(cursor, start)}
        </React.Fragment>,
      );
    }

    parts.push(
      <Box
        key={note._id || `note-${index}`}
        component="span"
        onClick={(event) => {
          setActiveNote(note);
          setAnchorEl(event.currentTarget);
        }}
        sx={{
          color: "primary.main",
          borderBottom: "1px dotted",
          cursor: "pointer",
        }}
      >
        {text.slice(start, end)}
      </Box>,
    );

    cursor = end;
  });

  parts.push(
    <React.Fragment key="remaining">{text.slice(cursor)}</React.Fragment>,
  );

  return (
    <>
      <Typography
        component="div"
        sx={{
          fontSize: "23px",
          lineHeight: 1.45,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {parts}
      </Typography>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setActiveNote(null);
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {activeNote && (
          <Box sx={{ p: 2, maxWidth: 320 }}>
            <Typography
              sx={{
                fontSize: "16px",
                lineHeight: 1.6,
                mb: onEditFootnote ? 1.5 : 0,
              }}
            >
              {activeNote.content}
            </Typography>

            {onEditFootnote && (
              <Typography
                component="button"
                onClick={() => {
                  onEditFootnote(activeNote);
                  setAnchorEl(null);
                  setActiveNote(null);
                }}
                sx={{
                  display: "block",
                  mt: 1,
                  color: "primary.main",
                  cursor: "pointer",
                  background: "none",
                  border: 0,
                  fontSize: "14px",
                  textTransform: "none",
                  px: 1,
                }}
              >
                Edit Footnote
              </Typography>
            )}
          </Box>
        )}
      </Popover>
    </>
  );
}
