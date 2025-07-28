import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./Edit.css";
import Loader from "../components/Loader";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Modal,
  IconButton,
  Tooltip,
  Popover,
  Popper,
  Paper,
} from "@mui/material";
import { SnackbarAlert } from "../utils/helperFunctions";
import { baseURL } from "../utils/constants";
import { useAuth } from "../components/AuthContext";
import {
  DragIndicator,
  AddCircleOutline,
  ContentCopy,
  DeleteOutline,
  Close,
  Edit as EditIcon,
  Cancel,
  CheckCircle,
} from "@mui/icons-material";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SeoHelmet from "../components/SeoHelmet";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function SortableBlock({
  block,
  index,
  handleChange,
  onAddBelow,
  onDuplicate,
  onDelete,
  onMouseUp,
  footnotes,
  setEditedNasheed,
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

  let engCopy = block.eng;
  footnotes.forEach((note, i) => {
    if (note.verseIndex !== index) {
      return;
    }
    const [_start, end] = note.range;

    const supTag = `<sup style="cursor:pointer; color:#6faeec" data-idx="${i}">${
      i + 1
    }</sup>`;

    engCopy = engCopy.slice(0, end) + supTag + engCopy.slice(end);
  });

  return (
    <Box
      className={"nasheed-lyrics"}
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
        className="non-arab-text"
        name={`eng_${index}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck="false"
        placeholder="Enter translation"
        data-index={index}
        onInput={() => {}}
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
        dangerouslySetInnerHTML={{ __html: engCopy || "" }}
      />
    </Box>
  );
}

function Edit() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nasheed, setNasheed] = useState(null);
  const [editedNasheed, setEditedNasheed] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [showAlert, setShowAlert] = useState(false);
  const [open, setOpen] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectedRange, setSelectedRange] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [showFootnoteModal, setShowFootnoteModal] = useState(false);
  const [footnoteContent, setFootnoteContent] = useState("");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
  const [openFootnote, setOpenFootnote] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editingFootnote, setEditingFootnote] = useState(false);
  const [editedFootnote, setEditedFootnote] = useState("");

  const { id } = useParams();
  const token = localStorage.getItem("token");
  const sensors = useSensors(useSensor(PointerSensor));

  const allowEdit = user?.admin || nasheed?.creatorId === user?.id;

  const engCopy = nasheed?.eng ? [...nasheed.eng] : null;

  nasheed?.footnotes?.forEach((note, i) => {
    const original = engCopy[note.verseIndex] || "";
    const [_start, end] = note.range;

    const supTag = `<sup style="cursor:pointer; color:#6faeec" data-idx="${i}">${
      i + 1
    }</sup>`;

    engCopy[note.verseIndex] =
      original.slice(0, end) + supTag + original.slice(end);
  });

  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (target.tagName === "SUP" && target.dataset.idx) {
        setOpenFootnote(parseInt(target.dataset.idx));
        if (!editing) setAnchorEl(target);
      }
    };

    const container = document.querySelector(".wrapper");
    container?.addEventListener("click", handler);

    return () => container?.removeEventListener("click", handler);
  }, [editing, nasheed]);

  const handleClose = () => {
    setOpenFootnote(null);
  };

  const handleMouseUp = (e, blockIdx) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const selected = selection.toString();
      const start = range.startOffset;
      const end = range.endOffset;

      setSelectedText(selected);
      setSelectedRange([start, end]);
      setSelectedBlockIndex(blockIdx);
      setPopoverCoords({
        top: rect.top - 40 + window.scrollY,
        left: rect.left,
      });
      setShowPopover(true);
    }
  };

  const handleSaveFootnote = () => {
    if (selectedRange) {
      const newFootnote = {
        range: selectedRange,
        content: footnoteContent,
        verseIndex: selectedBlockIndex,
      };

      setEditedNasheed((prev) => {
        const updatedFootnotes = [...prev.footnotes, newFootnote].sort(
          (a, b) => {
            if (a.verseIndex !== b.verseIndex) {
              return a.verseIndex - b.verseIndex;
            }
            return a.range[0] - b.range[0];
          }
        );

        return { ...prev, footnotes: updatedFootnotes };
      });
      setShowFootnoteModal(false);
      setShowPopover(false);
      setFootnoteContent("");
    }
  };

  useEffect(() => {
    fetch(`${baseURL}/nasheed/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setNasheed(data.foundNasheed);
        setEditedNasheed({
          arabTitle: data.foundNasheed.arabTitle,
          engTitle: data.foundNasheed.engTitle,
          footnotes: data.foundNasheed.footnotes,
          blocks: data.foundNasheed.arab.map((_, i) => ({
            id: i.toString(),
            arab: data.foundNasheed.arab[i],
            rom: data.foundNasheed.rom[i],
            eng: data.foundNasheed.eng[i],
          })),
        });
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const target = e.currentTarget;
    const name = target.getAttribute("name") || "";
    const [field, index] = name.split("_");

    const value =
      target.tagName === "DIV" && target.isContentEditable
        ? target.innerHTML.replace(/<sup[^>]*>.*?<\/sup>/g, "")
        : target.value;

    setEditedNasheed((prev) => {
      const copy = { ...prev };
      copy.blocks[+index][field] = value;
      return copy;
    });
  };

  const nasheedLyrics = nasheed?.arab?.map((arab, index) => {
    return (
      <div key={index} className="nasheed-lyrics">
        <p>{arab}</p>
        <p>
          <em dangerouslySetInnerHTML={{ __html: nasheed.rom[index] }} />
        </p>
        <p dangerouslySetInnerHTML={{ __html: engCopy[index] }} />
      </div>
    );
  });

  const toggleEdit = () => {
    setEditing((prevState) => !prevState);
  };

  const updateNasheed = async () => {
    setOpen(false);

    if (!token) {
      setAlert({
        type: "error",
        message: "You must be logged in.",
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const formattedData = {
      arab: editedNasheed.blocks.map((b) => b.arab),
      rom: editedNasheed.blocks.map((b) => b.rom),
      eng: editedNasheed.blocks.map((b) => b.eng),
      arabTitle: editedNasheed.arabTitle,
      engTitle: editedNasheed.engTitle,
      footnotes: editedNasheed.footnotes,
    };

    try {
      const response = await fetch(`${baseURL}/nasheed/${id}`, {
        method: "PUT",
        body: JSON.stringify(formattedData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await response.json();

      if (!response.ok) {
        if (res.code === 11000) {
          setAlert({
            type: "error",
            message: "Nasheed with same name already exists.",
          });
        } else {
          setAlert({
            type: "error",
            message: res.message || "Failed to update nasheed.",
          });
        }
      } else {
        setAlert({
          type: "success",
          message: "Successfully updated nasheed!",
        });
        setNasheed({ ...res });
        setEditedNasheed({
          footnotes: res.footnotes,
          arabTitle: res.arabTitle,
          engTitle: res.engTitle,
          blocks: res.arab.map((_, i) => ({
            id: i.toString(),
            arab: res.arab[i],
            rom: res.rom[i],
            eng: res.eng[i],
          })),
        });
        toggleEdit();
        setAlert({ message: "Successfully Updated Nasheed", type: "success" });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "Network error occurred. Please try again.",
      });
    }

    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  const handleAddBelow = (index) => {
    const newBlock = {
      arab: "",
      rom: "",
      eng: "",
    };
    const updatedBlocks = [...editedNasheed.blocks];
    updatedBlocks.splice(index + 1, 0, newBlock);
    setEditedNasheed({ ...editedNasheed, blocks: updatedBlocks });
  };

  const handleDuplicate = (index) => {
    const blockToCopy = editedNasheed.blocks[index];
    const newBlock = {
      arab: blockToCopy.arab,
      rom: blockToCopy.rom,
      eng: blockToCopy.eng,
    };
    const updatedBlocks = [...editedNasheed.blocks];
    updatedBlocks.splice(index + 1, 0, newBlock);
    setEditedNasheed({ ...editedNasheed, blocks: updatedBlocks });
  };

  const handleDeleteBlock = (index) => {
    const updatedBlocks = [...editedNasheed.blocks];
    updatedBlocks.splice(index, 1);
    setEditedNasheed({ ...editedNasheed, blocks: updatedBlocks });
  };

  const handleEditClick = () => {
    setEditingFootnote(true);
  };

  const handleSave = () => {
    setEditedNasheed((prev) => {
      const updatedFootnotes = prev.footnotes;
      updatedFootnotes[openFootnote].content = editedFootnote;
      return { ...prev, updatedFootnotes };
    });
    setEditingFootnote(false);
  };

  const handleCancel = () => {
    setEditedFootnote(editedNasheed.footnotes[openFootnote]?.content);
    setEditingFootnote(false);
  };

  const handleDeleteFootnote = () => {
    setEditedNasheed((prev) => {
      const updatedFootnotes = [...editedNasheed.footnotes];
      updatedFootnotes.splice(openFootnote, 1);
      return { ...prev, footnotes: updatedFootnotes };
    });
    setOpenFootnote(null);
  };

  useEffect(() => {
    setEditedFootnote(editedNasheed?.footnotes[openFootnote]?.content);
  }, [openFootnote, editedNasheed?.footnotes]);

  if (isLoading) return <Loader />;
  return editing ? (
    <>
      <SeoHelmet
        title={nasheed.engTitle}
        description={`Edit nasheed titles "${nasheed.engTitle}" with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/${id}`}
      />

      <Dialog
        open={openFootnote !== null}
        onClose={() => setOpenFootnote(null)}
        fullWidth
        maxWidth="sm"
        sx={{ "& .MuiDialogContent-root": { fontSize: "1.5rem" } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, fontSize: "1.7rem" }}>
          {editedNasheed.blocks[
            editedNasheed.footnotes[openFootnote]?.verseIndex
          ]?.eng?.slice(
            editedNasheed.footnotes[openFootnote]?.range?.[0],
            editedNasheed.footnotes[openFootnote]?.range?.[1]
          )}
          <sup>{openFootnote + 1}</sup>
          <Tooltip
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  fontSize: "12px",
                  padding: "5px 10px",
                },
              },
            }}
            title="Close"
          >
            <IconButton
              aria-label="close"
              onClick={() => setOpenFootnote(null)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <Close fontSize="large" />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent dividers>
          {editingFootnote ? (
            <TextField
              fullWidth
              multiline
              value={editedFootnote}
              onChange={(e) => setEditedFootnote(e.target.value)}
              minRows={3}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: "1.3rem",
                },
                "& .MuiInputLabel-root": {
                  fontSize: "1.3rem",
                },
              }}
            />
          ) : (
            <div>{editedNasheed.footnotes[openFootnote]?.content}</div>
          )}
        </DialogContent>

        <DialogActions>
          {editingFootnote ? (
            <>
              <Tooltip
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "12px",
                      padding: "5px 10px",
                    },
                  },
                }}
                title="Cancel Edit"
              >
                <IconButton aria-label="revert footnote" onClick={handleCancel}>
                  <Cancel fontSize="large" />
                </IconButton>
              </Tooltip>

              <Tooltip
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "12px",
                      padding: "5px 10px",
                    },
                  },
                }}
                title="Update Footnote"
              >
                <IconButton
                  sx={{ ml: "0 !important" }}
                  aria-label="save footnote"
                  onClick={handleSave}
                >
                  <CheckCircle fontSize="large" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "12px",
                      padding: "5px 10px",
                    },
                  },
                }}
                title="Edit"
              >
                <IconButton aria-label="edit" onClick={handleEditClick}>
                  <EditIcon fontSize="large" />
                </IconButton>
              </Tooltip>

              <Tooltip
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "12px",
                      padding: "5px 10px",
                    },
                  },
                }}
                title="Delete"
              >
                <IconButton aria-label="edit" onClick={handleDeleteFootnote}>
                  <DeleteOutline fontSize="large" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Popover
        open={showPopover}
        anchorReference="anchorPosition"
        anchorPosition={{ top: popoverCoords.top, left: popoverCoords.left }}
        onClose={() => setShowPopover(false)}
      >
        <Button onClick={() => setShowFootnoteModal(true)}>Add Footnote</Button>
      </Popover>

      <Dialog
        open={showFootnoteModal}
        onClose={() => setShowFootnoteModal(false)}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { fontSize: "1.5rem" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "1.5rem",
          }}
        >
          Add Footnote
          <IconButton
            aria-label="close"
            onClick={() => setShowFootnoteModal(false)}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <p>
            <strong>Selected:</strong> "{selectedText}"
          </p>
          <TextField
            multiline
            fullWidth
            label="Footnote content"
            value={footnoteContent}
            onChange={(e) => setFootnoteContent(e.target.value)}
            sx={{
              fontSize: "1.2rem",
              "& .MuiOutlinedInput-root": { fontSize: "1.2rem" },
              "& .MuiInputBase-input": { fontSize: "1.2rem" },
              "& .MuiInputLabel-root": { fontSize: "1.2rem" },
              "& .MuiFormLabel-root": { fontSize: "1.2rem" },
              "& .MuiInputBase-root": { fontSize: "1.2rem" },
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button
            sx={{ fontSize: "1.1rem" }}
            onClick={() => setShowFootnoteModal(false)}
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            sx={{ fontSize: "1.1rem" }}
            onClick={handleSaveFootnote}
            variant="contained"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-confirm" sx={style}>
          <Typography
            className="modal-confirm-text"
            id="modal-modal-title"
            variant="h4"
            component="h2"
          >
            Are you sure you want to update?
          </Typography>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "20px",
            }}
          >
            <Button
              style={{
                backgroundColor: "#A42A04",
                marginRight: "5px",
              }}
              className="mui-button"
              variant="contained"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              style={{
                marginRight: "5px",
              }}
              className="mui-button"
              variant="contained"
              onClick={updateNasheed}
            >
              Yes
            </Button>
          </div>
        </Box>
      </Modal>
      <SnackbarAlert
        open={showAlert}
        onClose={() => setShowAlert(false)}
        message={alert.message}
        type={alert.type}
      />
      <div className="wrapper">
        <div style={{ flex: 1 }} />
        <div className="container">
          <div className="edit-title">
            <textarea
              name="arabTitle"
              placeholder="Enter Arabic/Urdu title"
              value={editedNasheed.arabTitle}
              onChange={(e) =>
                setEditedNasheed({
                  ...editedNasheed,
                  arabTitle: e.target.value,
                })
              }
            />
            <textarea
              name="engTitle"
              placeholder="Enter English title"
              value={editedNasheed.engTitle}
              onChange={(e) =>
                setEditedNasheed({
                  ...editedNasheed,
                  engTitle: e.target.value,
                })
              }
            />
          </div>
          <div style={{ marginTop: "-20px" }} className="body">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;

                const oldIdx = editedNasheed.blocks.findIndex(
                  (b) => b.id === active.id
                );
                const newIdx = editedNasheed.blocks.findIndex(
                  (b) => b.id === over.id
                );

                if (oldIdx !== -1 && newIdx !== -1) {
                  setEditedNasheed((prev) => ({
                    ...prev,
                    blocks: arrayMove(prev.blocks, oldIdx, newIdx),
                  }));
                }
              }}
            >
              <SortableContext
                items={editedNasheed.blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {editedNasheed.blocks.map((block, index) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    index={index}
                    handleChange={handleChange}
                    onAddBelow={handleAddBelow}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDeleteBlock}
                    onMouseUp={handleMouseUp}
                    footnotes={editedNasheed.footnotes}
                    setEditedNasheed={setEditedNasheed}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
        <div className="edit-buttons">
          <Button
            style={{
              backgroundColor: "#A42A04",
              marginBottom: "5px",
            }}
            className="mui-button"
            variant="contained"
            onClick={toggleEdit}
          >
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: "#2f7c31" }}
            className="mui-button"
            variant="contained"
            onClick={() => setOpen(true)}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  ) : (
    <>
      <Popper
        open={openFootnote !== null}
        anchorEl={anchorEl}
        placement="top-start"
        style={{ zIndex: 1300 }}
      >
        <Paper sx={{ maxWidth: 300, position: "relative" }}>
          <IconButton
            size="small"
            onClick={() => {
              setOpenFootnote(null);
              setAnchorEl(null);
            }}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              zIndex: 1,
            }}
          >
            <Close fontSize="small" />
          </IconButton>

          <Typography sx={{ fontSize: "1.2rem", padding: 2, pt: 4 }}>
            {openFootnote !== null
              ? nasheed.footnotes[openFootnote]?.content
              : ""}
          </Typography>
        </Paper>
      </Popper>
      <SeoHelmet
        title={nasheed.engTitle}
        description={`Edit nasheed titled "${nasheed.engTitle}" with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/${id}`}
      />
      <div className="wrapper">
        <div style={{ flex: 1 }} />
        <div className="container">
          <SnackbarAlert
            open={showAlert}
            onClose={() => setShowAlert(false)}
            message={alert.message}
            type={alert.type}
          />{" "}
          <div className="edit-title">
            <p>{nasheed.arabTitle}</p>
            <p>{nasheed.engTitle}</p>
          </div>
          <div className="body">{nasheedLyrics}</div>
        </div>
        <div className="edit-buttons">
          {
            <Button
              className="mui-button"
              variant="contained"
              onClick={toggleEdit}
              style={{ visibility: allowEdit ? "visible" : "hidden" }}
            >
              Edit
            </Button>
          }
        </div>
      </div>
    </>
  );
}

export default Edit;
