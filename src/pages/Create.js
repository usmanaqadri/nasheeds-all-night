import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  keyframes,
  CircularProgress,
  Popover,
  Container,
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

function htmlToPlainTextWithNewlines(html) {
  // Replace <div> and </div> with \n
  let text = html
    .replace(/<sup[^>]*>.*?<\/sup>/g, "") // remove sup tags
    .replace(/<div><br><\/div>/gi, "\n") // empty lines
    .replace(/<div>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n") // <br> to newline
    .replace(/&nbsp;/gi, " ") // decode common entity
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+\n/g, "\n");

  return text.trim();
}

function RichTextField({
  label,
  name,
  value,
  required,
  onChange,
  endAdornment,
  disabled,
  editableRef,
  footnotes = null,
  onMouseUp = () => {},
  placeholder = "Enter a value",
  multiline = false,
}) {
  let val = value.replace(/<sup[^>]*>.*?<\/sup>/g, "");

  if (name === "eng" && footnotes?.length) {
    let offset = 0;

    footnotes.forEach((note, i) => {
      const [start, end] = note.range;

      const supTag = `<sup style="cursor:pointer; color:#6faeec" data-idx="${i}">${
        i + 1
      }</sup>`;

      const adjustedEnd = end + offset;

      val = val.slice(0, adjustedEnd) + supTag + val.slice(adjustedEnd);

      offset += supTag.length;
    });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        width: multiline ? "100%" : "33%",
        minWidth: "250px",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ color: "text.secondary", textAlign: "left", fontSize: "1.5rem" }}
      >
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </Typography>
      <Box sx={{ position: "relative", width: "100%" }}>
        <Box
          ref={editableRef}
          contentEditable={!disabled}
          onKeyDown={(e) => {
            if (!multiline && e.key === "Enter") e.preventDefault(); // disable line breaks
          }}
          dangerouslySetInnerHTML={{ __html: val }}
          onMouseUp={onMouseUp}
          onInput={() => {}}
          onBlur={(e) => {
            const newVal = htmlToPlainTextWithNewlines(
              e.currentTarget.innerHTML
            );
            const oldVal = val;

            console.log("here is newVal", newVal);
            console.log("here is oldVal", oldVal);

            let updatedFootnotes = [];

            if (footnotes?.length) {
              updatedFootnotes = footnotes
                .map((note) => {
                  const footnotedText = oldVal.slice(
                    note.range[0],
                    note.range[1]
                  );

                  if (newVal.indexOf(footnotedText) !== -1) {
                    return {
                      ...note,
                      range: [
                        newVal.indexOf(footnotedText),
                        newVal.indexOf(footnotedText) + footnotedText.length,
                      ],
                    };
                  } else {
                    return null;
                  }
                })
                .filter(Boolean);
            }

            onChange?.({
              name,
              value: newVal,
              footnotes: updatedFootnotes,
            });
          }}
          sx={{
            textAlign: "left",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            padding: multiline ? "12.5px 14px" : "16.5px 14px",
            paddingRight: endAdornment ? "48px" : "14px", // leave space for adornment
            minHeight: multiline ? "145px" : "56px", // match default TextField height
            fontSize: "1.5rem",
            fontFamily: "Roboto, Helvetica, Arial, sans-serif",
            lineHeight: 1.4375, // default for MUI
            width: "100%",
            overflow: "auto", // allow scrolling
            whiteSpace: "pre", // preserve spacing + allow horizontal overflow
            wordBreak: "normal", // don't break long words
            overflowX: "auto", // specifically allow horizontal scrolling
            "&:focus": {
              outline: disabled ? "none" : "2px solid #1976d2",
            },
            "&:empty::before": {
              content: `"${placeholder}"`,
              color: "rgba(0, 0, 0, 0.38)", // MUI's default placeholder color
              pointerEvents: "none",
              display: "block",
            },
          }}
        />
        {endAdornment && (
          <Box
            sx={{
              position: "absolute",
              top: 4,
              right: 14,
              zIndex: 1,
              pointerEvents: disabled ? "none" : "auto",
            }}
          >
            {endAdornment}
          </Box>
        )}
      </Box>
    </Box>
  );
}

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
  const [indicesToOffset, setIndicesToOffset] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
  const [showFootnoteModal, setShowFootnoteModal] = useState(false);
  const [footnoteContent, setFootnoteContent] = useState("");
  const [openFootnote, setOpenFootnote] = useState(null);
  const [selectedFootnote, setSelectedFootnote] = useState(null);
  const [editingFootnote, setEditingFootnote] = useState(false);
  const editableRef = useRef(null);

  const popoverContentRef = useRef(null);

  console.log("here is nasheed", nasheed);

  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (target.tagName === "SUP" && target.dataset.idx) {
        setOpenFootnote(parseInt(target.dataset.idx));
        setSelectedFootnote(nasheed?.footnotes[parseInt(target.dataset.idx)]);
      }
    };

    const container = document.querySelector(".create-nasheed-form");
    container?.addEventListener("click", handler);

    return () => container?.removeEventListener("click", handler);
  }, [nasheed]);

  const handleMouseUp = (e) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const selected = selection.toString();

    console.log("what do we got in here?", e.target.innerText);
    console.log("indices to shift/offset", indicesToOffset);

    console.log("what is selected", selected);
    if (!selected.trim() || selection.rangeCount === 0 || range.collapsed) {
      setShowPopover(false);
      return;
    }

    const rect = range.getBoundingClientRect();

    setSelectedText(selected);

    let offset = 0;
    const parent = e.currentTarget;
    const preSelectionRange = document.createRange();
    preSelectionRange.setStart(parent, 0);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    for (const indexThatShifts of indicesToOffset) {
      console.log("am I in this?", indexThatShifts);
      if (start > indexThatShifts) offset--;
    }
    console.log("here is start", start);
    console.log("here is offset", offset);
    const adjustedStart = start + offset;
    const end = adjustedStart + selected.length;

    console.log("here is the start and end", adjustedStart, end);

    console.log(
      "does this match the selected?",
      e.target.innerText.slice(adjustedStart, end)
    );

    setSelectedRange([adjustedStart, end]);
    setShowPopover(true);

    setTimeout(() => {
      const width = popoverContentRef.current?.offsetWidth || 0;
      const centerX = rect.left + rect.width / 2;
      const topY = rect.top - 40 + window.scrollY;
      setPopoverCoords({
        top: topY,
        left: centerX - width / 2 + window.scrollX,
      });
    }, 0);
  };

  const handleSaveFootnote = () => {
    if (!selectedRange) return;

    setIndicesToOffset((prev) => {
      return [...prev, selectedRange[1]].sort((a, b) => a - b);
    });

    const tempFootnote = {
      range: [...selectedRange], // clone to avoid mutation
      content: footnoteContent,
      verseIndex: "",
    };

    setNasheed((prev) => {
      const oldFootnotes = prev.footnotes || [];
      const newFootnotes = [];
      let inserted = false;

      for (let i = 0; i <= oldFootnotes.length; i++) {
        const fn = oldFootnotes[i];

        // Insert the new footnote at the right place
        if (
          !inserted &&
          (i === oldFootnotes.length || tempFootnote.range[0] < fn.range[0])
        ) {
          newFootnotes.push(tempFootnote);
        }

        if (fn) {
          newFootnotes.push(fn);
        }
      }

      return { ...prev, footnotes: newFootnotes };
    });

    setShowFootnoteModal(false);
    setShowPopover(false);
    setFootnoteContent("");
  };

  const handleChange = (target) => {
    const { name, value, footnotes } = target;
    setNasheed((prev) => ({
      ...prev,
      [name]: value,
      ...(footnotes != null ? { footnotes } : {}),
    }));
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

    const adjustedFootnotes = nasheed.footnotes.map((footnote) => {
      const { range } = footnote;
      const [start, end] = range;

      let verseIndex = -1;
      let runningOffset = 0;

      for (let i = 0; i < engVerses.length; i++) {
        const verse = engVerses[i];
        const verseStart = runningOffset;
        const verseEnd = runningOffset + verse.length;

        if (start >= verseStart && end <= verseEnd) {
          verseIndex = i;

          return {
            ...footnote,
            verseIndex,
            range: [start - verseStart, end - verseStart],
          };
        }

        runningOffset = verseEnd + 1; // Only update AFTER checking this verse
      }

      // fallback (if somehow not found)
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

  const handleCancel = () => {
    setSelectedFootnote((prev) => ({
      ...prev,
      content: nasheed.footnotes[openFootnote]?.content,
    }));
    setEditingFootnote(false);
  };

  const handleDeleteFootnote = () => {
    setNasheed((prev) => {
      const updatedFootnotes = [];
      prev.footnotes.forEach((fn, index) => {
        if (index === openFootnote) {
          setIndicesToOffset((prev) => {
            return prev.filter((idx) => fn.range[1] !== idx);
          });
          return;
        }
        updatedFootnotes.push(fn);
      });
      return { ...prev, footnotes: updatedFootnotes };
    });

    setOpenFootnote(null);
  };

  const handleSave = () => {
    setNasheed((prev) => {
      const updatedFootnotes = prev.footnotes;
      updatedFootnotes[openFootnote] = selectedFootnote;
      return { ...prev, updatedFootnotes };
    });
    setEditingFootnote(false);
  };

  return (
    <>
      <SeoHelmet
        title={"Add your own favorite nasheed to our collection."}
        description={`Add your own nasheed with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/create`}
        type="website"
      />
      <FootnoteDialog
        open={openFootnote !== null}
        onClose={() => setOpenFootnote(null)}
        title={
          <span>
            {nasheed.eng?.slice(
              selectedFootnote?.range?.[0],
              selectedFootnote?.range?.[1]
            )}
            <sup>{openFootnote + 1}</sup>
          </span>
        }
        content={selectedFootnote?.content}
        isEditing={editingFootnote}
        onChange={(val) =>
          setSelectedFootnote((prev) => ({ ...prev, content: val }))
        }
        onCancelEdit={handleCancel}
        onSave={handleSave}
        onEditClick={() => setEditingFootnote(true)}
        onDelete={handleDeleteFootnote}
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
      <Box
        className="create-nasheed-form"
        component="form"
        onSubmit={handleSubmit}
        sx={styles.formContainer}
      >
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
        <Container sx={{ display: "flex", justifyContent: "center" }}>
          <RichTextField
            label="Arabic Title"
            name="arabTitle"
            placeholder="Enter Arabic Title"
            required
            value={nasheed.arabTitle}
            onChange={handleChange}
          />
        </Container>
        <Container sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <RichTextField
            label="English Title"
            name="engTitle"
            value={nasheed.engTitle}
            onChange={handleChange}
            required
            placeholder="Enter English Title"
          />
        </Container>
        <Grid container spacing={2} sx={styles.gridContainer}>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <Box sx={{ position: "relative" }}>
              <RichTextField
                label="Arabic/Urdu verses"
                name="arab"
                value={nasheed.arab}
                onChange={handleChange}
                multiline
                placeholder="One verse per line"
              />
              <Box sx={{ mb: 2, height: "1.4rem" }} />{" "}
              {/* Placeholder for alignment */}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <Box sx={{ position: "relative" }}>
              <RichTextField
                label="Transliteration Verses"
                name="rom"
                value={nasheed.rom}
                onChange={handleChange}
                multiline
                placeholder="One verse per line"
                disabled={loadingTransliteration}
                endAdornment={
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
                }
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
              <Box sx={{ mb: 2, height: "1.4rem" }} />{" "}
              {/* Placeholder for alignment */}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <Box sx={{ position: "relative" }}>
              <RichTextField
                label="English Verses"
                name="eng"
                value={nasheed.eng}
                onChange={handleChange}
                onMouseUp={handleMouseUp}
                multiline
                editableRef={editableRef}
                placeholder="One verse per line"
                disabled={loadingTranslation}
                footnotes={nasheed.footnotes}
                endAdornment={
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
                }
              />
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
