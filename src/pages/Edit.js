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
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { SnackbarAlert } from "../utils/helperFunctions";
import { baseURL } from "../utils/constants";
import { useAuth } from "../components/AuthContext";
import { IconButton, Tooltip } from "@mui/material";
import {
  DragIndicator,
  AddCircleOutline,
  ContentCopy,
  DeleteOutline,
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
      <textarea
        className="non-arab-text"
        name={`eng_${index}`}
        placeholder="Enter translation"
        value={block.eng}
        onChange={handleChange}
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
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const sensors = useSensors(useSensor(PointerSensor));

  const allowEdit = user?.admin || nasheed?.creatorId === user?.id;
  useEffect(() => {
    fetch(`${baseURL}/nasheed/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setNasheed(data.foundNasheed);
        setEditedNasheed({
          arabTitle: data.foundNasheed.arabTitle,
          engTitle: data.foundNasheed.engTitle,
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
    const [field, index] = e.target.name.split("_");
    setEditedNasheed((prev) => {
      const copy = { ...prev };
      copy.blocks[+index][field] = e.target.value;
      return copy;
    });
  };

  const nasheedLyrics = nasheed?.arab?.map((arab, index) => {
    return (
      <div key={index}>
        <p>{arab}</p>
        <p>
          <em dangerouslySetInnerHTML={{ __html: nasheed.rom[index] }} />
        </p>
        <p>{nasheed.eng[index]}</p>
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

  if (isLoading) return <Loader />;
  return editing ? (
    <>
      <SeoHelmet
        title={nasheed.engTitle}
        description={`Edit nasheed titles "${nasheed.engTitle}" with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/${id}`}
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
