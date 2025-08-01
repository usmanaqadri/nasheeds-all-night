import React, { useState, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
  keyframes,
  CircularProgress,
  Popover,
} from "@mui/material";
import { baseURL } from "../utils/constants";
import { SnackbarAlert, sortFootnotes } from "../utils/helperFunctions";
import { useAuth } from "../components/AuthContext";
import SeoHelmet from "../components/SeoHelmet";
import { AutoAwesome } from "@mui/icons-material";
import FootnoteDialog from "../components/FootnoteDialog";
import getCaretCoordinates from "textarea-caret";

const colorFlash = keyframes`
  0% { color: #ff4081; }
  25% { color: #7c4dff; }
  50% { color: #40c4ff; }
  75% { color: #69f0ae; }
  100% { color: #ff4081; }
`;

const styles = {
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    maxWidth: "80vw",
    margin: "0 auto",
    height: "75vh",
    padding: "20px",
    overflowY: "auto",
  },
  title: {
    width: "33%",
    minWidth: "250px",
    mx: "auto",
    "& .MuiInputBase-input": { fontSize: "1.5rem" },
    "& .MuiInputLabel-root": { fontSize: "1.5rem" },
    "& .MuiFormLabel-root": { fontSize: "1.5rem" },
    "& .MuiInputBase-root": { fontSize: "1.5rem" },
  },
  gridContainer: {
    flexGrow: 1,
    alignItems: "stretch",
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
  },
  lyrics: {
    height: "80%",
    display: "flex",
    flexDirection: "column",

    "& .MuiInputBase-root": {
      fontSize: "1.5rem",
      height: "100%",
      display: "flex",
      alignItems: "flex-start",
    },
    "& .MuiInputBase-input.MuiInputBase-inputMultiline": {
      fontSize: "1.5rem",
      overflow: "auto",
      height: "100%",
      resize: "none",
      paddingTop: "14px",
      boxSizing: "border-box",
    },
    "& .MuiInputLabel-root": {
      fontSize: "1.5rem",
    },
    "& .MuiFormLabel-root": {
      fontSize: "1.5rem",
    },
  },

  submitButton: {
    width: "40%",
    maxWidth: "200px",
    mx: "auto",
    padding: 1,
    fontSize: "1.5rem",
  },
};

const Create = () => {
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [loadingTransliteration, setLoadingTransliteration] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [nasheed, setNasheed] = useState({
    arabTitle: "",
    engTitle: "",
    arab: "",
    rom: "",
    eng: "",
    footnotes: [],
  });
  const { user } = useAuth();
  const token = localStorage.getItem("token");
  const [popoverCoords, setPopoverCoords] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [selectedRange, setSelectedRange] = useState(null);
  const [showPopover, setShowPopover] = useState(false);
  const [showFootnoteModal, setShowFootnoteModal] = useState(false);
  const [footnoteContent, setFootnoteContent] = useState("");
  const textFieldRef = useRef(null);
  const popoverContentRef = useRef(null);

  const handleMouseUp = (e, blockIdx) => {
    const textarea = textFieldRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end);

    if (start === end || !selected.trim()) {
      setShowPopover(false);
      return;
    }

    const caretStart = getCaretCoordinates(textarea, start);
    const caretEnd = getCaretCoordinates(textarea, end);

    const caretCoords = {
      top: caretStart.top,
      left: (caretStart.left + caretEnd.left) / 2,
    };

    const rect = textarea.getBoundingClientRect();
    const baseLeft = rect.left + caretCoords.left + window.scrollX;
    const top = rect.top + caretCoords.top + window.scrollY - 40;

    // Wait until popover renders, then re-center it
    setTimeout(() => {
      const width = popoverContentRef.current?.offsetWidth || 0;
      setPopoverCoords({
        top,
        left: baseLeft - width / 2,
      });
    }, 0);

    setSelectedText(selected);
    setSelectedRange([start, end]);
    setShowPopover(true);
  };

  const handleSaveFootnote = () => {
    if (selectedRange) {
      const tempFootnote = {
        range: selectedRange,
        content: footnoteContent,
        verseIndex: "",
      };

      setNasheed((prev) => {
        const tmpFootnotes = [...prev.footnotes, tempFootnote].sort(
          sortFootnotes
        );

        return { ...prev, footnotes: tmpFootnotes };
      });
      setShowFootnoteModal(false);
      setShowPopover(false);
      setFootnoteContent("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNasheed((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setAlert({
        type: "error",
        message: "You must be logged in to add your own nasheed.",
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const engVerses = nasheed.eng.split("\n");

    let currentOffset = 0;

    const adjustedFootnotes = nasheed.footnotes.map((footnote) => {
      const { range } = footnote;
      const [start, end] = range;

      // Find which verse this footnote belongs to
      let verseIndex = -1;
      for (let i = 0; i < engVerses.length; i++) {
        const verse = engVerses[i];
        const verseStart = currentOffset;
        const verseEnd = currentOffset + verse.length;

        if (start >= verseStart && end <= verseEnd) {
          verseIndex = i;

          return {
            ...footnote,
            verseIndex,
            range: [start - verseStart, end - verseStart],
          };
        }

        currentOffset = verseEnd + 1; // +1 for newline character
      }

      // fallback in case not found
      return footnote;
    });

    const formattedData = {
      ...nasheed,
      arab: nasheed.arab.split("\n").filter((line) => line.trim() !== ""),
      rom: nasheed.rom.split("\n").filter((line) => line.trim() !== ""),
      eng: nasheed.eng.split("\n").filter((line) => line.trim() !== ""),
      footnotes: adjustedFootnotes,
      creatorId: user?.id,
      isPublic: false,
    };

    try {
      const response = await fetch(`${baseURL}/nasheed/create`, {
        method: "POST",
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
            message: res.message || "Failed to add nasheed.",
          });
        }
      } else {
        setAlert({
          type: "success",
          message: "Successfully added nasheed!",
        });
        setNasheed({
          arabTitle: "",
          engTitle: "",
          arab: "",
          rom: "",
          eng: "",
        });
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

  const getTransliteration = async (e) => {
    e.preventDefault();
    setLoadingTransliteration(true);

    const arabicArr = nasheed.arab
      .split("\n")
      .filter((line) => line.trim() !== "");

    try {
      const response = await fetch(
        `${baseURL}/nasheed/generate-transliteration`,
        {
          method: "POST",
          body: JSON.stringify({ arabicArr }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const res = await response.json();

      setNasheed((prev) => ({ ...prev, rom: res.transliteration }));
    } catch (error) {
      setAlert({
        type: "error",
        message: "Network error occurred. Please try again.",
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
    setLoadingTransliteration(false);
  };

  const getTranslation = async (e) => {
    e.preventDefault();
    setLoadingTranslation(true);

    const arabicArr = nasheed.arab
      .split("\n")
      .filter((line) => line.trim() !== "");

    try {
      const response = await fetch(`${baseURL}/nasheed/generate-translation`, {
        method: "POST",
        body: JSON.stringify({ arabicArr }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const res = await response.json();

      setNasheed((prev) => ({ ...prev, eng: res.translation }));
    } catch (error) {
      setAlert({
        type: "error",
        message: "Network error occurred. Please try again.",
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    }
    setLoadingTranslation(false);
  };

  return (
    <>
      <SeoHelmet
        title={"Add your own favorite nasheed to our collection."}
        description={`Add your own nasheed with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/create`}
        type="website"
      />
      <Popover
        open={showPopover}
        anchorReference="anchorPosition"
        disableEnforceFocus
        disableAutoFocus
        anchorPosition={{
          top: popoverCoords.top,
          left: popoverCoords.left,
        }}
        onClose={() => setShowPopover(false)}
      >
        <Box ref={popoverContentRef}>
          <Button
            size="large"
            onClick={() => {
              setShowFootnoteModal(true);
              setShowPopover(false);
            }}
          >
            Add Footnote
          </Button>
        </Box>
      </Popover>
      <Box component="form" onSubmit={handleSubmit} sx={styles.formContainer}>
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
        <Typography textAlign={"left"} variant="h4" component="h1" gutterBottom>
          Add Your Favorite Nasheed
        </Typography>
        <Typography
          fontSize={"1.5rem"}
          textAlign="left"
          variant="body1"
          sx={{ mb: 3 }}
        >
          Add a nasheed you love to your private collection. It'll only be
          visible to you for now. Later, you'll have the option to make it
          public through a review process to ensure quality.
        </Typography>
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />{" "}
        <TextField
          label="Arabic/Urdu Title"
          name="arabTitle"
          value={nasheed.arabTitle}
          onChange={handleChange}
          required
          sx={styles.title}
        />
        <TextField
          label="English Title"
          name="engTitle"
          value={nasheed.engTitle}
          onChange={handleChange}
          required
          sx={styles.title}
        />
        <Grid container spacing={2} sx={styles.gridContainer}>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <Box sx={{ position: "relative" }}>
              <Box sx={{ mb: 2, height: "1.4rem" }} />{" "}
              {/* Placeholder for alignment */}
              <TextField
                label="Arabic/Urdu verses (one per line)"
                name="arab"
                value={nasheed.arab}
                onChange={handleChange}
                multiline
                minRows={10}
                sx={styles.lyrics}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <Box sx={{ position: "relative" }}>
              <Box sx={{ mb: 2, height: "1.4rem" }} />{" "}
              {/* Placeholder for alignment */}
              <TextField
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: "12px",
                              padding: "5px 10px",
                            },
                          },
                        }}
                        placement="top"
                        title="Use AI to generate"
                      >
                        <span>
                          {" "}
                          <IconButton
                            edge="end"
                            onClick={getTransliteration}
                            disabled={loadingTransliteration}
                          >
                            <AutoAwesome
                              fontSize="large"
                              sx={
                                loadingTransliteration
                                  ? {
                                      animation: `${colorFlash} 2s infinite`,
                                    }
                                  : {}
                              }
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                label="Transliteration verses (one per line)"
                name="rom"
                value={nasheed.rom}
                onChange={handleChange}
                multiline
                minRows={10}
                sx={{
                  opacity: loadingTransliteration ? 0.6 : 1,
                  ...styles.lyrics,
                }}
                disabled={loadingTransliteration}
              />
              {loadingTransliteration && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <Box sx={{ position: "relative" }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: "gray",
                  fontStyle: "italic",
                  fontSize: "1.0rem",
                  textAlign: "left",
                  minHeight: "1.4rem", // matches other placeholder height
                }}
              >
                Tip: Highlight part of the English translation to add a
                footnote.
              </Typography>
              <TextField
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip
                        componentsProps={{
                          tooltip: {
                            sx: {
                              fontSize: "12px",
                              padding: "5px 10px",
                            },
                          },
                        }}
                        placement="top"
                        title="Use AI to generate"
                      >
                        <span>
                          {" "}
                          {/* for disabled IconButton workaround */}
                          <IconButton
                            edge="end"
                            onClick={getTranslation}
                            disabled={loadingTranslation}
                          >
                            <AutoAwesome
                              fontSize="large"
                              sx={
                                loadingTranslation
                                  ? {
                                      animation: `${colorFlash} 2s infinite`,
                                    }
                                  : {}
                              }
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                label="English verses (one per line)"
                name="eng"
                value={nasheed.eng}
                onChange={handleChange}
                onMouseUp={handleMouseUp}
                inputRef={textFieldRef}
                multiline
                minRows={10}
                sx={{
                  opacity: loadingTranslation ? 0.6 : 1,
                  ...styles.lyrics,
                }}
                disabled={loadingTranslation}
              />

              {loadingTranslation && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
        <Button variant="contained" type="submit" sx={styles.submitButton}>
          Submit
        </Button>
      </Box>
    </>
  );
};

export default Create;
