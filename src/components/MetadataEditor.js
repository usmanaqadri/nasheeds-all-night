import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  Stack,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";

export function MetadataEditor({ draft, setDraft, readOnly = false }) {
  const [inputs, setInputs] = useState({
    performers: "",
    tags: "",
    alternateTitles: "",
  });

  const updateField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addItem = (field) => {
    const value = inputs[field].trim();
    if (!value) return;

    setDraft((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), value],
    }));

    setInputs((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const removeItem = (field, index) => {
    setDraft((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const renderListField = (field, label) => (
    <Box>
      <Typography sx={{ mb: 1 }}>{label}</Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
        {(draft[field] || []).map((item, index) => (
          <Chip
            key={`${field}-${index}`}
            label={item}
            onDelete={() => removeItem(field, index)}
          />
        ))}
      </Stack>

      <TextField
        fullWidth
        size="small"
        placeholder={`Add ${label.toLowerCase()} (press Enter)`}
        value={inputs[field]}
        onChange={(e) =>
          setInputs((prev) => ({
            ...prev,
            [field]: e.target.value,
          }))
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addItem(field);
          }
        }}
        onBlur={() => addItem(field)}
      />
    </Box>
  );

  if (readOnly) {
    const metadata = [
      { label: "Poet", value: draft.poet },
      { label: "Description", value: draft.description },
      {
        label: "Language",
        value: draft.language || "ar",
      },
      {
        label: "Performers",
        value: draft.performers?.join(", "),
      },
      {
        label: "Tags",
        value: draft.tags?.join(", "),
      },
      {
        label: "Alternate Titles",
        value: draft.alternateTitles?.join(", "),
      },
    ];

    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 1,
          width: "100%",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontSize: "18px", fontWeight: 600, mb: 2 }}
        >
          Metadata
        </Typography>

        <Stack spacing={2}>
          {metadata.map(({ label, value }) => (
            <Box key={label}>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                {label}
              </Typography>

              <Typography
                sx={{
                  fontSize: "16px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {value || "—"}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    );
  }

  return (
    <Box
      className="v2-metadata-editor"
      sx={{
        "& .MuiTypography-root": {
          fontSize: "16px",
        },

        "& .MuiInputBase-input": {
          fontSize: "16px",
          lineHeight: 1.5,
        },

        "& .MuiInputLabel-root": {
          fontSize: "15px",
        },

        "& .MuiFormHelperText-root": {
          fontSize: "13px",
        },

        "& .MuiChip-label": {
          fontSize: "14px",
        },

        "& .MuiButton-root": {
          fontSize: "15px",
          textTransform: "none",
        },
      }}
    >
      <Accordion
        className="v2-metadata"
        disableGutters
        elevation={0}
        sx={{
          border: "1px solid #ddd",
          borderRadius: "4px !important",
          mb: 3,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontSize: 18 }}>Metadata</Typography>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Poet"
              value={draft.poet || ""}
              onChange={(e) => updateField("poet", e.target.value)}
              fullWidth
            />

            <TextField
              label="Description"
              value={draft.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            <TextField
              label="Language"
              value={draft.language ?? "ar"}
              onChange={(e) => updateField("language", e.target.value)}
              helperText="Language code, e.g. ar, ur, en"
              fullWidth
            />

            {renderListField("performers", "Performers")}
            {renderListField("tags", "Tags")}
            {renderListField("alternateTitles", "Alternate Titles")}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
