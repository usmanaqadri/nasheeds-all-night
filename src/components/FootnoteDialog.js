import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
} from "@mui/material";
import {
  Close,
  Cancel,
  CheckCircle,
  Edit as EditIcon,
  DeleteOutline,
} from "@mui/icons-material";

export default function FootnoteDialog({
  open,
  onClose,
  title,
  content,
  isEditing = false,
  onChange,
  onCancelEdit,
  onSave,
  onEditClick,
  onDelete,
  onAdd,
  mode = "view", // "view" | "edit" | "add"
  fontSize = "1.5rem",
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{ "& .MuiDialogContent-root": { fontSize } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "1.7rem",
        }}
      >
        {title}
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
            onClick={onClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <Close fontSize="large" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers={!isEditing && mode !== "add"}>
        {isEditing || mode === "add" ? (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={content}
            onChange={(e) => onChange?.(e.target.value)}
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                fontSize: "1.3rem",
              },
              "& .MuiInputBase-input": {
                fontSize: "1.3rem",
              },
              "& .MuiInputLabel-root": {
                fontSize: "1.3rem",
                transform: "translate(14px, 12px) scale(1)",
              },
              "& .MuiInputLabel-shrink": {
                transform: "translate(14px, -9px) scale(0.75)",
              },
            }}
            label="Footnote content"
          />
        ) : (
          <div>{content}</div>
        )}
      </DialogContent>

      <DialogActions>
        {mode === "add" ? (
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
              title="Cancel"
            >
              <IconButton onClick={onClose}>
                <Cancel sx={{ color: "rgb(164, 42, 4)" }} fontSize="large" />
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
              title="Add"
            >
              <IconButton onClick={onAdd}>
                <CheckCircle
                  sx={{ color: "rgb(47, 124, 49)" }}
                  fontSize="large"
                />
              </IconButton>
            </Tooltip>
          </>
        ) : isEditing ? (
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
              <IconButton onClick={onCancelEdit}>
                <Cancel sx={{ color: "rgb(164, 42, 4)" }} fontSize="large" />
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
              title="Save"
            >
              <IconButton onClick={onSave}>
                <CheckCircle
                  sx={{ color: "rgb(47, 124, 49)" }}
                  fontSize="large"
                />
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
              <IconButton onClick={onEditClick}>
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
              <IconButton onClick={onDelete}>
                <DeleteOutline
                  style={{ color: "rgb(164, 42, 4)" }}
                  fontSize="large"
                />
              </IconButton>
            </Tooltip>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
