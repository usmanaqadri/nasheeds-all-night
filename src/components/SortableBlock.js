import { useSortable } from "@dnd-kit/sortable";
import { Box, Tooltip, IconButton } from "@mui/material";
import {
  DragIndicator,
  AddCircleOutline,
  ContentCopy,
  DeleteOutline,
} from "@mui/icons-material";
import { CSS } from "@dnd-kit/utilities";

export function SortableBlock({
  block,
  index,
  handleChange,
  onAddBelow,
  onDuplicate,
  onDelete,
  onMouseUp,
  footnotes,
  setEditedNasheed,
  setShowPopover,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  let engWFootnote = block.eng.slice(0);
  let offset = 0;
  footnotes.forEach((note, i) => {
    if (note.verseIndex !== index) {
      return;
    }
    const [_start, end] = note.range;

    const supTag = `<sup style="cursor:pointer; color:#6faeec" data-idx="${i}">${
      i + 1
    }</sup>`;

    const adjustedEnd = end + offset;

    engWFootnote =
      engWFootnote.slice(0, adjustedEnd) +
      supTag +
      engWFootnote.slice(adjustedEnd);

    offset += supTag.length; // update the offset for future insertions
  });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? "#f0f0f0" : "#fafafa",
        boxShadow: isDragging ? "0 0 10px rgba(0,0,0,0.2)" : "none",
      }}
      sx={{
        padding: "10px",
        margin: "10px",
        border: "2px dashed #ccc",
        borderRadius: "10px",
        marginBottom: "24px",
        backgroundColor: "#fafafa",
        position: "relative",
        "&:hover": {
          boxShadow: "0 0 8px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: "5%",
          transform: "translateX(5%)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Tooltip
          title="Move verse"
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: "12px",
                padding: "5px 10px",
              },
            },
          }}
        >
          <IconButton
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            sx={{ cursor: "grab", touchAction: "none" }}
            size="small"
          >
            <DragIndicator />
          </IconButton>
        </Tooltip>

        <Tooltip
          title="Add verse"
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: "12px",
                padding: "5px 10px",
              },
            },
          }}
        >
          <IconButton
            onClick={() => onAddBelow(index)}
            aria-label="Add block below"
            size="small"
          >
            <AddCircleOutline />
          </IconButton>
        </Tooltip>

        <Tooltip
          title="Duplicate verse"
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: "12px",
                padding: "5px 10px",
              },
            },
          }}
        >
          <IconButton
            onClick={() => onDuplicate(index)}
            aria-label="Duplicate block"
            size="small"
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>

        <Tooltip
          title="Delete verse"
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                fontSize: "12px",
                padding: "5px 10px",
              },
            },
          }}
        >
          <IconButton
            size="small"
            onClick={() => onDelete(index)}
            aria-label="Delete block"
          >
            <DeleteOutline />
          </IconButton>
        </Tooltip>
      </Box>

      <textarea
        className="arab-text"
        name={`arab_${index}`}
        placeholder="Enter Arabic/Urdu line"
        value={block.arab}
        onChange={handleChange}
      />
      <textarea
        className="non-arab-text"
        name={`rom_${index}`}
        placeholder="Enter transliteration"
        value={block.rom}
        onChange={handleChange}
      />
      <div
        key={engWFootnote}
        className="non-arab-text"
        name={`eng_${index}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck="false"
        placeholder="Enter translation"
        data-index={index}
        onInput={() => setShowPopover(false)}
        onBlur={(e) => {
          const newText = e.currentTarget.innerHTML.replace(
            /<sup[^>]*>.*?<\/sup>/g,
            ""
          );
          const oldText = block.eng || "";

          // Update footnote ranges
          const updatedFootnotes = footnotes.map((note) => {
            if (note.verseIndex !== index) return note;
            const footnotedText = oldText.slice(note.range[0], note.range[1]);

            if (newText.indexOf(footnotedText) !== -1) {
              return {
                ...note,
                range: [
                  newText.indexOf(footnotedText),
                  newText.indexOf(footnotedText) + footnotedText.length,
                ],
              };
            } else {
              return null;
            }
          });

          setEditedNasheed((prev) => ({
            ...prev,
            footnotes: updatedFootnotes,
          }));
          handleChange(e);
        }}
        onMouseUp={(e) => {
          onMouseUp(e, index);
        }}
        dangerouslySetInnerHTML={{ __html: engWFootnote || "" }}
      />
    </Box>
  );
}
