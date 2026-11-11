import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Popover,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  Add,
  Delete,
  ContentCopy,
  Star,
  StarOutline,
} from "@mui/icons-material";
import "../pages/Edit.css";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import getCaretCoordinates from "textarea-caret";

import { CSS } from "@dnd-kit/utilities";
import { DragIndicator } from "@mui/icons-material";

import { baseURL } from "../utils/constants";
import { useAuth } from "./AuthContext";
import { updateFootnotesForTextChange } from "../utils/footnoteOffsets";
import FootnotedTranslation from "./FootnotedTranslation";
import { MetadataEditor } from "./MetadataEditor";
import { sanitizeArabic } from "../utils/sanitizeArabic";

const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const newLine = () => ({
  _id: newId(),
  arab: "",
  rom: "",
  eng: "",
});

const newStanza = () => ({
  _id: newId(),
  lines: [newLine(), newLine()],
});

const move = (items, from, to) => {
  if (to < 0 || to >= items.length) return items;
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
};

function SortableSequenceBlock({
  id,
  item,
  index,
  lines,
  isRefrain,
  onUpdateLine,
  onMoveLine,
  onAddLine,
  onDeleteLine,
  onRemoveLineFromRefrain,
  onRemove,
  onDuplicate,
  onMakeRefrain,
  onEditFootnote,
  onAddFootnote,
  footnotes,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const [selection, setSelection] = useState(null);

  const handleTextSelection = (event, lineId) => {
    const textarea = event.target;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (typeof start !== "number" || typeof end !== "number" || start === end) {
      setSelection(null);
      return;
    }

    // Find the coordinates of both ends of the selection.
    const startCoords = getCaretCoordinates(textarea, start);
    const endCoords = getCaretCoordinates(textarea, end);

    const rect = textarea.getBoundingClientRect();

    // Convert textarea-relative coordinates to viewport coordinates.
    const startX = rect.left + startCoords.left - textarea.scrollLeft;
    const endX = rect.left + endCoords.left - textarea.scrollLeft;

    const startY = rect.top + startCoords.top - textarea.scrollTop;
    const endY = rect.top + endCoords.top - textarea.scrollTop;

    // Anchor the popover near the selected phrase.
    // For multi-line selections, anchor near the end.
    const sameLine = Math.abs(startY - endY) < 5;

    const x = sameLine ? (startX + endX) / 2 : endX;

    const y = sameLine ? startY : endY;

    setSelection({
      lineId,
      start,
      end,
      anchorPosition: {
        top: y,
        left: x,
      },
    });
  };

  return (
    <div
      ref={setNodeRef}
      className="v2-sequence-block"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="v2-block-toolbar">
        <span className="v2-block-label">
          {item.type === "refrain"
            ? isRefrain
              ? "Repeated Refrain"
              : "Refrain (Editable)"
            : `Stanza ${index + 1}`}
        </span>

        <div className="v2-block-actions">
          <IconButton
            size="small"
            title="Drag to reorder"
            {...attributes}
            {...listeners}
            sx={{ cursor: "grab", touchAction: "none" }}
          >
            <DragIndicator fontSize="small" />
          </IconButton>

          {!isRefrain && (
            <IconButton
              size="small"
              title="Make refrain"
              onClick={onMakeRefrain}
            >
              <StarOutline fontSize="small" />
            </IconButton>
          )}

          <IconButton
            size="small"
            title="Repeat this block"
            onClick={onDuplicate}
          >
            <ContentCopy fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            title="Remove from sequence"
            onClick={onRemove}
          >
            <Delete fontSize="small" />
          </IconButton>
        </div>
      </div>

      {lines.map((line, lineIndex) => (
        <div className="v2-edit-line" key={line._id}>
          <div className="v2-line-actions">
            <IconButton
              size="small"
              disabled={isRefrain || lineIndex === 0}
              onClick={() => onMoveLine(lineIndex, -1)}
            >
              <ArrowUpward fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              disabled={isRefrain || lineIndex === lines.length - 1}
              onClick={() => onMoveLine(lineIndex, 1)}
            >
              <ArrowDownward fontSize="small" />
            </IconButton>

            {item.type === "refrain" ? (
              !isRefrain && (
                <IconButton
                  size="small"
                  title="Remove line from all occurrences of this refrain"
                  onClick={() => onRemoveLineFromRefrain(line._id)}
                  sx={{
                    color: "#b45309",
                    "&:hover": {
                      backgroundColor: "rgba(180, 83, 9, 0.08)",
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )
            ) : (
              <IconButton
                size="small"
                title="Delete line from source stanza"
                onClick={() => onDeleteLine(line._id)}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </div>

          {["arab", "rom", "eng"].map((field) => (
            <TextField
              key={field}
              className={`v2-lyric-input v2-${field}`}
              variant="standard"
              fullWidth
              multiline
              minRows={1}
              maxRows={5}
              value={line[field] || ""}
              placeholder={
                {
                  arab: "Arabic / Urdu",
                  rom: "Transliteration",
                  eng: "English translation",
                }[field]
              }
              onChange={(e) => onUpdateLine(line._id, field, e.target.value)}
              onSelect={
                field === "eng" && !isRefrain
                  ? (e) => handleTextSelection(e, line._id)
                  : undefined
              }
              InputProps={{
                disableUnderline: true,
                readOnly: isRefrain,
              }}
              sx={{
                width: "100%",
                "& .MuiInputBase-input": {
                  textAlign: "center",
                  direction: field === "arab" ? "rtl" : "ltr",
                },
              }}
            />
          ))}

          {!isRefrain &&
            footnotes?.some(
              (note) => String(note.lineId) === String(line._id),
            ) && (
              <Box sx={{ mt: 0.5, width: "100%" }}>
                <FootnotedTranslation
                  text={line.eng}
                  lineId={line._id}
                  footnotes={footnotes}
                  onEditFootnote={onEditFootnote}
                />
              </Box>
            )}
        </div>
      ))}

      <Popover
        open={Boolean(selection)}
        anchorReference="anchorPosition"
        anchorPosition={
          selection?.anchorPosition || {
            top: 0,
            left: 0,
          }
        }
        onClose={() => setSelection(null)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        disableRestoreFocus
        marginThreshold={8}
        slotProps={{
          paper: {
            sx: {
              p: 0.5,
              borderRadius: 1,
            },
          },
        }}
      >
        <Button
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!selection) return;

            onAddFootnote(selection.lineId, selection.start, selection.end);

            setSelection(null);
          }}
        >
          + Add Footnote
        </Button>
      </Popover>

      {!isRefrain && (
        <Button size="large" onClick={onAddLine} sx={{ mt: 1 }}>
          + Add Line
        </Button>
      )}
    </div>
  );
}

const emptyNasheed = () => {
  const stanza = newStanza();
  return {
    arabTitle: "",
    engTitle: "",
    slug: "",
    stanzas: [stanza],
    refrains: [],
    sequence: [{ type: "stanza", stanzaId: stanza._id }],
    footnotes: [],
    recordings: [],
    collections: [],
    poet: "",
    description: "",
    language: "ar",
    performers: [],
    tags: [],
    alternateTitles: [],
    isPublic: false,
    schemaVersion: 2,
  };
};

export default function NasheedV2Editor({ mode = "edit" }) {
  const isCreating = mode === "create";
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();

  const [nasheed, setNasheed] = useState(null);
  const [draft, setDraft] = useState(() =>
    isCreating ? emptyNasheed() : null,
  );
  const [loading, setLoading] = useState(!isCreating);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(isCreating);
  const [message, setMessage] = useState(null);
  const [footnoteSelection, setFootnoteSelection] = useState(null);
  const [footnoteContent, setFootnoteContent] = useState("");
  const [footnoteDialogOpen, setFootnoteDialogOpen] = useState(false);

  useEffect(() => {
    if (isCreating) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setMessage(null);

      try {
        const response = await fetch(
          `${baseURL}/nasheedV2/${encodeURIComponent(slug)}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status}`);
        }

        const { foundNasheed } = await response.json();

        if (!foundNasheed) {
          throw new Error("Nasheed not found");
        }

        if (!cancelled) {
          setNasheed(foundNasheed);
          setDraft(structuredClone(foundNasheed));
        }
      } catch (error) {
        if (!cancelled) {
          setMessage({ type: "error", text: error.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, isCreating]);

  const canEdit =
    !!user &&
    (isCreating ||
      user.admin ||
      String(nasheed?.creatorId) === String(user.id));

  const change = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateStanzas = (fn) => {
    setDraft((prev) => ({
      ...prev,
      stanzas: fn(prev.stanzas),
    }));
  };

  const updateLine = (stanzaId, lineId, field, value) => {
    setDraft((prev) => {
      const stanza = prev.stanzas.find((s) => s._id === stanzaId);

      const line = stanza?.lines.find((l) => l._id === lineId);

      if (!line) return prev;

      const oldValue = line[field] || "";

      const stanzas = prev.stanzas.map((s) =>
        s._id !== stanzaId
          ? s
          : {
              ...s,
              lines: s.lines.map((l) =>
                l._id === lineId ? { ...l, [field]: value } : l,
              ),
            },
      );

      const footnotes =
        field === "eng"
          ? updateFootnotesForTextChange(
              prev.footnotes,
              lineId,
              oldValue,
              value,
            )
          : prev.footnotes;

      return {
        ...prev,
        stanzas,
        footnotes,
      };
    });
  };

  const addStanza = () => {
    const stanza = newStanza();

    setDraft((prev) => ({
      ...prev,
      stanzas: [...prev.stanzas, stanza],
      sequence: [...prev.sequence, { type: "stanza", stanzaId: stanza._id }],
    }));
  };

  const duplicateStanza = (stanzaId) => {
    setDraft((prev) => {
      const index = prev.stanzas.findIndex((s) => s._id === stanzaId);
      if (index < 0) return prev;

      const source = prev.stanzas[index];
      const copy = {
        _id: newId(),
        lines: source.lines.map((line) => ({
          ...line,
          _id: newId(),
        })),
      };

      const stanzas = [...prev.stanzas];
      stanzas.splice(index + 1, 0, copy);

      return {
        ...prev,
        stanzas,
        sequence: [...prev.sequence, { type: "stanza", stanzaId: copy._id }],
      };
    });
  };

  const deleteStanza = (stanzaId) => {
    setDraft((prev) => {
      const stanza = prev.stanzas.find((s) => s._id === stanzaId);
      const lineIds = new Set(stanza?.lines.map((line) => line._id) || []);

      const removedRefrainIds = new Set(
        prev.refrains.filter((r) => r.stanzaId === stanzaId).map((r) => r._id),
      );

      return {
        ...prev,
        stanzas: prev.stanzas.filter((s) => s._id !== stanzaId),
        refrains: prev.refrains.filter((r) => r.stanzaId !== stanzaId),
        sequence: prev.sequence.filter(
          (item) =>
            item.stanzaId !== stanzaId &&
            !removedRefrainIds.has(item.refrainId),
        ),
        footnotes: prev.footnotes.filter((note) => !lineIds.has(note.lineId)),
      };
    });
  };

  const addLine = (stanzaId) => {
    updateStanzas((stanzas) =>
      stanzas.map((s) =>
        s._id === stanzaId ? { ...s, lines: [...s.lines, newLine()] } : s,
      ),
    );
  };

  const deleteLine = (stanzaId, lineId) => {
    setDraft((prev) => ({
      ...prev,
      stanzas: prev.stanzas.map((s) =>
        s._id === stanzaId
          ? {
              ...s,
              lines: s.lines.filter((l) => l._id !== lineId),
            }
          : s,
      ),
      refrains: prev.refrains.map((r) =>
        r.stanzaId === stanzaId
          ? {
              ...r,
              lineIds: r.lineIds.filter((id) => id !== lineId),
            }
          : r,
      ),
      footnotes: prev.footnotes.filter((note) => note.lineId !== lineId),
    }));
  };

  const removeLineFromRefrain = (refrainId, lineId) => {
    setDraft((prev) => {
      const refrain = prev.refrains.find(
        (r) => String(r._id) === String(refrainId),
      );

      if (!refrain) return prev;

      const sourceStanza = prev.stanzas.find(
        (s) => String(s._id) === String(refrain.stanzaId),
      );

      if (!sourceStanza) return prev;

      // An empty lineIds array currently means ALL stanza lines.
      const currentLineIds = refrain.lineIds.length
        ? refrain.lineIds.map(String)
        : sourceStanza.lines.map((line) => String(line._id));

      const remainingLineIds = currentLineIds.filter(
        (id) => id !== String(lineId),
      );

      // If no lines remain, remove the refrain entirely.
      if (remainingLineIds.length === 0) {
        return {
          ...prev,
          refrains: prev.refrains.filter(
            (r) => String(r._id) !== String(refrainId),
          ),
          sequence: prev.sequence.filter(
            (item) =>
              !(
                item.type === "refrain" &&
                String(item.refrainId) === String(refrainId)
              ),
          ),
        };
      }

      // Update the shared refrain definition.
      // Every occurrence automatically reflects this change.
      return {
        ...prev,
        refrains: prev.refrains.map((r) =>
          String(r._id) === String(refrainId)
            ? { ...r, lineIds: remainingLineIds }
            : r,
        ),
      };
    });
  };

  const addRefrain = () => {
    if (!draft.stanzas.length) return;

    const refrain = {
      _id: newId(),
      name: `Refrain ${draft.refrains.length + 1}`,
      stanzaId: draft.stanzas[0]._id,
      lineIds: [],
    };

    setDraft((prev) => ({
      ...prev,
      refrains: [...prev.refrains, refrain],
      sequence: [...prev.sequence, { type: "refrain", refrainId: refrain._id }],
    }));
  };

  const updateRefrain = (id, patch) => {
    setDraft((prev) => ({
      ...prev,
      refrains: prev.refrains.map((r) =>
        r._id === id ? { ...r, ...patch } : r,
      ),
    }));
  };

  const deleteRefrain = (id) => {
    setDraft((prev) => ({
      ...prev,
      refrains: prev.refrains.filter((r) => r._id !== id),
      sequence: prev.sequence.filter((item) => item.refrainId !== id),
    }));
  };

  const addSequenceItem = (type, id) => {
    setDraft((prev) => ({
      ...prev,
      sequence: [
        ...prev.sequence,
        type === "stanza" ? { type, stanzaId: id } : { type, refrainId: id },
      ],
    }));
  };

  const updateSequence = (fn) => {
    setDraft((prev) => ({
      ...prev,
      sequence: fn(prev.sequence),
    }));
  };

  const updateFootnote = (index, patch) => {
    setDraft((prev) => ({
      ...prev,
      footnotes: prev.footnotes.map((note, i) =>
        i === index ? { ...note, ...patch } : note,
      ),
    }));
  };

  const deleteFootnote = (footnoteId) => {
    setDraft((prev) => ({
      ...prev,
      footnotes: prev.footnotes.filter((note) => note._id !== footnoteId),
    }));
  };

  const save = async () => {
    if (!canEdit || !draft) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({
        type: "error",
        text: "You must be logged in.",
      });
      return;
    }

    if (!draft.engTitle.trim() || !draft.arabTitle.trim()) {
      setMessage({ type: "error", text: "Both titles are required." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const cleanedStanzas = draft.stanzas.map((stanza) => {
      const cleanedArabic = sanitizeArabic(stanza.lines.arab);
      stanza.lines.arab = cleanedArabic;
      return stanza;
    });

    try {
      // Only send editable fields; preserve IDs and references.
      const payload = {
        arabTitle: sanitizeArabic(draft.arabTitle),
        engTitle: draft.engTitle,
        stanzas: cleanedStanzas,
        refrains: draft.refrains,
        sequence: draft.sequence,
        footnotes: draft.footnotes,

        // Metadata
        poet: draft.poet || "",
        description: draft.description || "",
        language: draft.language || "ar",
        performers: draft.performers || [],
        tags: draft.tags || [],
        alternateTitles: draft.alternateTitles || [],
        ...(isCreating
          ? {
              creatorId: user.id,
              isPublic: false,
              schemaVersion: 2,
              recordings: draft.recordings || [],
              collections: draft.collections || [],
            }
          : {}),
      };

      const response = await fetch(
        isCreating
          ? `${baseURL}/nasheedV2/create`
          : `${baseURL}/nasheedV2/${nasheed._id}`,
        {
          method: isCreating ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save nasheed");
      }

      const savedNasheed = result.nasheed || result.createdNasheed || result;
      if (isCreating) {
        // The create endpoint should return the new document with its slug.
        if (savedNasheed.slug) {
          navigate(`/${encodeURIComponent(savedNasheed.slug)}`);
        } else {
          setMessage({
            type: "success",
            text: "Nasheed created successfully.",
          });
          setNasheed(savedNasheed);
          setDraft(emptyNasheed());
        }
      } else {
        setNasheed(savedNasheed);
        setDraft(structuredClone(savedNasheed));
        setEditing(false);
        setMessage({ type: "success", text: "Nasheed updated successfully." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const reorderSequence = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = Number(String(active.id).replace("seq-", ""));

    const newIndex = Number(String(over.id).replace("seq-", ""));

    setDraft((prev) => ({
      ...prev,
      sequence: arrayMove(prev.sequence, oldIndex, newIndex),
    }));
  };

  const removeSequenceItem = (index) => {
    setDraft((prev) => ({
      ...prev,
      sequence: prev.sequence.filter((_, i) => i !== index),
    }));
  };

  const repeatSequenceItem = (index) => {
    setDraft((prev) => {
      const sequence = [...prev.sequence];

      sequence.splice(index + 1, 0, {
        ...sequence[index],
      });

      return { ...prev, sequence };
    });
  };

  const insertStanzaAt = (index) => {
    const stanza = newStanza();

    setDraft((prev) => {
      const sequence = [...prev.sequence];

      sequence.splice(index, 0, {
        type: "stanza",
        stanzaId: stanza._id,
      });

      return {
        ...prev,
        stanzas: [...prev.stanzas, stanza],
        sequence,
      };
    });
  };

  const insertExistingAt = (index, type, id) => {
    setDraft((prev) => {
      const sequence = [...prev.sequence];

      sequence.splice(
        index,
        0,
        type === "stanza" ? { type, stanzaId: id } : { type, refrainId: id },
      );

      return { ...prev, sequence };
    });
  };

  const makeRefrain = (stanzaId, index) => {
    setDraft((prev) => {
      const existing = prev.refrains.find(
        (r) => r.stanzaId === stanzaId && r.lineIds.length === 0,
      );

      const refrain = existing || {
        _id: newId(),
        name: `Refrain ${prev.refrains.length + 1}`,
        stanzaId,
        lineIds: [],
      };

      const sequence = [...prev.sequence];

      sequence.splice(index + 1, 0, {
        type: "refrain",
        refrainId: refrain._id,
      });

      return {
        ...prev,
        refrains: existing ? prev.refrains : [...prev.refrains, refrain],
        sequence,
      };
    });
  };

  const openFootnoteDialog = (lineId, start, end) => {
    if (start === end) return;

    setFootnoteSelection({
      lineId,
      range: [start, end],
    });

    setFootnoteContent("");
    setFootnoteDialogOpen(true);
  };

  const openEditFootnoteDialog = (note) => {
    const index = draft.footnotes.findIndex(
      (item) =>
        item === note || (item._id && String(item._id) === String(note._id)),
    );

    if (index === -1) return;

    setFootnoteSelection({
      lineId: note.lineId,
      range: [...note.range],
      editIndex: index,
    });

    setFootnoteContent(note.content);
    setFootnoteDialogOpen(true);
  };

  const saveFootnote = () => {
    if (!footnoteSelection || !footnoteContent.trim()) return;

    setDraft((prev) => {
      const note = {
        _id: newId(),
        lineId: footnoteSelection.lineId,
        range: [...footnoteSelection.range],
        content: footnoteContent.trim(),
      };

      const footnotes = [...prev.footnotes];

      if (footnoteSelection.editIndex !== undefined) {
        footnotes[footnoteSelection.editIndex] = {
          ...footnotes[footnoteSelection.editIndex],
          ...note,
        };
      } else {
        footnotes.push(note);
      }

      return { ...prev, footnotes };
    });

    setFootnoteDialogOpen(false);
    setFootnoteSelection(null);
    setFootnoteContent("");
  };

  if (loading) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!draft) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {message?.text || "Unable to load nasheed."}
        </Alert>
      </Box>
    );
  }

  const stanzaById = Object.fromEntries(draft.stanzas.map((s) => [s._id, s]));

  const refrainById = Object.fromEntries(draft.refrains.map((r) => [r._id, r]));

  const resolveSequenceItem = (item) => {
    if (item.type === "stanza") {
      return stanzaById[item.stanzaId]?.lines || [];
    }

    const refrain = refrainById[item.refrainId];
    if (!refrain) return [];

    const stanza = stanzaById[refrain.stanzaId];
    if (!stanza) return [];

    return refrain.lineIds.length
      ? stanza.lines.filter((line) => refrain.lineIds.includes(line._id))
      : stanza.lines;
  };

  const firstRefrainOccurrence = new Map();

  draft.sequence.forEach((item, index) => {
    if (
      item.type === "refrain" &&
      !firstRefrainOccurrence.has(String(item.refrainId))
    ) {
      firstRefrainOccurrence.set(String(item.refrainId), index);
    }
  });

  const seenFootnoteLines = new Set();

  const shouldShowFootnotes = (lineId) => {
    const id = String(lineId);

    if (seenFootnoteLines.has(id)) {
      return false;
    }

    seenFootnoteLines.add(id);
    return true;
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "none",
        mx: "auto",
        px: { xs: 2, md: 3 },
        py: 3,
      }}
    >
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <div className="v2-editor-layout">
        <div className="v2-three-column-layout">
          {/* LEFT: Metadata */}
          <aside className="v2-metadata-sidebar">
            <MetadataEditor
              draft={draft}
              setDraft={setDraft}
              readOnly={!editing}
            />
          </aside>

          {/* CENTER: Nasheed */}
          <main className="container v2-main-container">
            {!editing ? (
              <>
                <div className="edit-title">
                  <p>{draft.arabTitle}</p>
                  <p>{draft.engTitle}</p>
                </div>

                <div className="body">
                  {(() => {
                    const seenLineIds = new Set();

                    return draft.sequence.map((item, index) => {
                      const lines = resolveSequenceItem(item);

                      return (
                        <div key={index} className="translation-container">
                          {lines.map((line) => {
                            const lineId = String(line._id);
                            const showFootnotes = !seenLineIds.has(lineId);

                            seenLineIds.add(lineId);

                            return (
                              <div key={`${index}-${lineId}`}>
                                <p>{line.arab}</p>

                                <p>
                                  <em>{line.rom}</em>
                                </p>

                                <FootnotedTranslation
                                  text={line.eng}
                                  lineId={line._id}
                                  footnotes={
                                    showFootnotes ? draft.footnotes : []
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            ) : (
              <>
                <div className="edit-title">
                  <textarea
                    value={draft.arabTitle}
                    onChange={(e) => change("arabTitle", e.target.value)}
                    placeholder="Arabic / Urdu title"
                  />

                  <textarea
                    value={draft.engTitle}
                    onChange={(e) => change("engTitle", e.target.value)}
                    placeholder="English title"
                  />
                </div>

                <div className="body v2-edit-body">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={reorderSequence}
                  >
                    <SortableContext
                      items={draft.sequence.map((_, index) => `seq-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {draft.sequence.map((item, index) => {
                        const refrain =
                          item.type === "refrain"
                            ? refrainById[item.refrainId]
                            : null;

                        const stanzaId =
                          item.type === "stanza"
                            ? item.stanzaId
                            : refrain?.stanzaId;

                        const stanza = stanzaById[stanzaId];
                        const lines = resolveSequenceItem(item);

                        const isFirstRefrain =
                          item.type === "refrain" &&
                          firstRefrainOccurrence.get(String(item.refrainId)) ===
                            index;

                        // Only subsequent occurrences are read-only.
                        const isRefrain =
                          item.type === "refrain" && !isFirstRefrain;

                        return (
                          <React.Fragment key={`seq-${index}`}>
                            <SortableSequenceBlock
                              id={`seq-${index}`}
                              item={item}
                              index={index}
                              lines={lines}
                              isRefrain={isRefrain}
                              onUpdateLine={(lineId, field, value) =>
                                updateLine(stanzaId, lineId, field, value)
                              }
                              onMoveLine={(lineIndex, direction) =>
                                updateStanzas((items) =>
                                  items.map((s) =>
                                    s._id === stanzaId
                                      ? {
                                          ...s,
                                          lines: move(
                                            s.lines,
                                            lineIndex,
                                            lineIndex + direction,
                                          ),
                                        }
                                      : s,
                                  ),
                                )
                              }
                              onAddLine={() => addLine(stanzaId)}
                              onDeleteLine={(lineId) =>
                                deleteLine(stanzaId, lineId)
                              }
                              onEditFootnote={openEditFootnoteDialog}
                              onRemove={() => removeSequenceItem(index)}
                              onDuplicate={() => repeatSequenceItem(index)}
                              onMakeRefrain={() => makeRefrain(stanzaId, index)}
                              onRemoveLineFromRefrain={(lineId) =>
                                removeLineFromRefrain(item.refrainId, lineId)
                              }
                              onAddFootnote={(lineId, start, end) =>
                                openFootnoteDialog(lineId, start, end)
                              }
                              footnotes={draft.footnotes}
                            />

                            <Box
                              sx={{
                                textAlign: "center",
                                my: 0.25,
                                opacity: 0.4,
                                transition: "opacity 0.2s",
                                "&:hover": {
                                  opacity: 1,
                                },
                              }}
                            >
                              <Button
                                size="large"
                                sx={{
                                  py: 0.75,
                                  px: 2,
                                  minHeight: 36,
                                  fontSize: "15px",
                                  fontWeight: 500,
                                  textTransform: "none",
                                }}
                                onClick={() => insertStanzaAt(index + 1)}
                              >
                                + Insert New Stanza
                              </Button>
                            </Box>
                          </React.Fragment>
                        );
                      })}
                    </SortableContext>
                  </DndContext>

                  <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => insertStanzaAt(draft.sequence.length)}
                    >
                      + Add Stanza at End
                    </Button>
                  </Box>
                </div>
              </>
            )}
          </main>

          {/* RIGHT: Actions */}
          <aside className="v2-actions-sidebar">
            {!editing ? (
              canEdit && (
                <Button variant="contained" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (isCreating) {
                      navigate("/");
                    } else {
                      setDraft(structuredClone(nasheed));
                      setEditing(false);
                    }
                  }}
                  sx={{ backgroundColor: "#A42A04" }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  onClick={save}
                  disabled={saving || !canEdit}
                  sx={{ backgroundColor: "#2f7c31" }}
                >
                  {saving
                    ? "Saving..."
                    : isCreating
                      ? "Create Nasheed"
                      : "Save"}
                </Button>
              </>
            )}
          </aside>
        </div>
      </div>

      <Dialog
        open={footnoteDialogOpen}
        onClose={() => setFootnoteDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          {footnoteSelection?.editIndex !== undefined
            ? "Edit Footnote"
            : "Add Footnote"}
        </DialogTitle>

        <DialogContent>
          {footnoteSelection && (
            <Typography
              color="text.secondary"
              sx={{
                fontSize: "15px",
                mb: 2,
                mt: 1,
              }}
            >
              Selected text: "
              {draft.stanzas
                .flatMap((s) => s.lines)
                .find((line) => line._id === footnoteSelection.lineId)
                ?.eng.slice(
                  footnoteSelection.range[0],
                  footnoteSelection.range[1],
                )}
              "
            </Typography>
          )}

          <TextField
            label="Footnote"
            fullWidth
            multiline
            minRows={3}
            value={footnoteContent}
            onChange={(e) => setFootnoteContent(e.target.value)}
            InputLabelProps={{
              sx: {
                fontSize: "16px",
              },
            }}
            InputProps={{
              sx: {
                fontSize: "17px",
                lineHeight: 1.6,
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setFootnoteDialogOpen(false)}
            sx={{
              fontSize: "15px",
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={saveFootnote}
            disabled={!footnoteContent.trim()}
            sx={{
              fontSize: "15px",
              textTransform: "none",
              px: 2.5,
              py: 1,
            }}
          >
            {footnoteSelection?.editIndex !== undefined
              ? "Save Changes"
              : "Add Footnote"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
