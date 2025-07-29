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
  ClickAwayListener,
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
import FootnoteDialog from "../components/FootnoteDialog";

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

  let engCopy = block.eng.slice(0);
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
        key={engCopy}
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
  const [editedFootnote, setEditedFootnote] = useState(null);

  const { id } = useParams();
  const token = localStorage.getItem("token");
  const sensors = useSensors(useSensor(PointerSensor));

  const allowEdit = user?.admin || nasheed?.creatorId === user?.id;

  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (target.tagName === "SUP" && target.dataset.idx) {
        setOpenFootnote(parseInt(target.dataset.idx));
        if (editing) {
          setEditedFootnote(
            editedNasheed?.footnotes[parseInt(target.dataset.idx)]
          );
        } else {
          setFootnoteContent(nasheed.footnotes[parseInt(target.dataset.idx)]);
          setAnchorEl(target);
        }
      }
    };

    const container = document.querySelector(".wrapper");
    container?.addEventListener("click", handler);

    return () => container?.removeEventListener("click", handler);
  }, [editing, nasheed, editedNasheed]);

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
    let engCopy = nasheed?.eng?.[index];
    nasheed?.footnotes?.forEach((note, i) => {
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
      <div key={index}>
        <p>{arab}</p>
        <p>
          <em dangerouslySetInnerHTML={{ __html: nasheed.rom[index] }} />
        </p>
        <p dangerouslySetInnerHTML={{ __html: engCopy }} />
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
      eng: editedNasheed.blocks.map((b) =>
        b.eng.replace(/<sup[^>]*>.*?<\/sup>/g, "")
      ),
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
      updatedFootnotes[openFootnote] = editedFootnote;
      return { ...prev, updatedFootnotes };
    });
    setEditingFootnote(false);
  };

  const handleCancel = () => {
    setEditedFootnote((prev) => ({
      ...prev,
      content: nasheed.footnotes[openFootnote]?.content,
    }));
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

  if (isLoading) return <Loader />;
  return editing ? (
    <>
      <SeoHelmet
        title={nasheed.engTitle}
        description={`Edit nasheed titles "${nasheed.engTitle}" with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/${id}`}
      />

      <FootnoteDialog
        open={openFootnote !== null}
        onClose={() => setOpenFootnote(null)}
        title={
          <span>
            {editedNasheed.blocks[editedFootnote?.verseIndex]?.eng?.slice(
              editedFootnote?.range?.[0],
              editedFootnote?.range?.[1]
            )}
            <sup>{openFootnote + 1}</sup>
          </span>
        }
        content={editedFootnote?.content}
        isEditing={editingFootnote}
        onChange={(val) =>
          setEditedFootnote((prev) => ({ ...prev, content: val }))
        }
        onCancelEdit={handleCancel}
        onSave={handleSave}
        onEditClick={handleEditClick}
        onDelete={handleDeleteFootnote}
      />

      <Popover
        open={showPopover}
        anchorReference="anchorPosition"
        disableEnforceFocus
        disableAutoFocus
        anchorPosition={{ top: popoverCoords.top, left: popoverCoords.left }}
        onClose={() => setShowPopover(false)}
      >
        <Button
          onClick={() => {
            setShowFootnoteModal(true);
            setShowPopover(false);
          }}
        >
          Add Footnote
        </Button>
      </Popover>

      <FootnoteDialog
        open={showFootnoteModal}
        onClose={() => setShowFootnoteModal(false)}
        title={
          <span>
            {selectedText}
            <sup>x</sup>
          </span>
        }
        content={footnoteContent}
        onChange={setFootnoteContent}
        onAdd={handleSaveFootnote}
        mode="add"
      />

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
                    setShowPopover={setShowPopover}
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
        <ClickAwayListener
          onClickAway={() => {
            setOpenFootnote(null);
            setAnchorEl(null);
          }}
        >
          <Paper sx={{ maxWidth: 300, position: "relative" }}>
            <Tooltip
              title="Close"
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
            </Tooltip>

            <Typography sx={{ fontSize: "1.2rem", padding: 2, pt: 4 }}>
              {openFootnote !== null
                ? nasheed.footnotes[openFootnote]?.content
                : ""}
            </Typography>
          </Paper>
        </ClickAwayListener>
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
