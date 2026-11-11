/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Modal,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  Close,
  PictureAsPdf,
  Tv,
  ArticleOutlined,
  EditNote,
  CheckCircleOutline,
  ErrorOutline,
  DeleteOutline,
  LinkOutlined,
  SyncOutlined,
} from "@mui/icons-material";
import "./Modal.css";
import { generatePDF } from "../utils/generatePDF";
import { nasheedText, SnackbarAlert } from "../utils/helperFunctions";
import { useAuth } from "./AuthContext";
import { FootnotePopper } from "./FootnotePopper";
import { baseURL } from "../utils/constants";
import { getNasheedSlides } from "../utils/nasheedSlides";
import { sanitizeArabic } from "../utils/sanitizeArabic";

const buildSlideshowScreens = (sections = []) => {
  const screens = [];

  sections.forEach((section, sectionIndex) => {
    const sectionId = String(section.id || section._id || sectionIndex);

    if (section.type === "custom") {
      screens.push({
        type: "custom",
        section,
        title: section.title || "",
        lines: section.lines || [],
        key: `${sectionId}-custom`,
      });
      return;
    }

    if (section.showTitleIntro) {
      screens.push({
        type: "titleIntro",
        section,
        title: section.engTitle || "",
        arabTitle: section.arabTitle || "",
        key: `${sectionId}-intro`,
      });
    }

    // Each stanza/refrain block becomes its own presentation screen.
    const groups = new Map();

    (section.verses || []).forEach((verse) => {
      const blockKey = verse.blockIndex ?? 0;

      if (!groups.has(blockKey)) {
        groups.set(blockKey, []);
      }

      groups.get(blockKey).push(verse);
    });

    groups.forEach((lines, blockIndex) => {
      screens.push({
        type: "nasheed",
        section,
        lines,
        blockIndex,
        key: `${sectionId}-block-${blockIndex}`,
      });
    });
  });

  return screens;
};

export default function MyModal({
  open,
  onClose,
  nasheed,
  onSlideshowDeleted = () => {},
  presentationIndex = null,
  onPresentationIndexChange = null,
  forcePresentationMode = false,
  disablePresentationControls = false,
  sessionMeta = null,
}) {
  const { user } = useAuth();
  const isV2 = nasheed?.schemaVersion === 2;
  const isSlideshow = nasheed?.type === "slideshow";
  const slideshowSections = nasheed?.slides || [];
  const slideshowScreens = useMemo(
    () => (isSlideshow ? buildSlideshowScreens(slideshowSections) : []),
    [isSlideshow, slideshowSections],
  );
  const isSlideBased = isV2 || isSlideshow;

  const slides = useMemo(() => getNasheedSlides(nasheed), [nasheed]);

  const totalScreens = isSlideshow ? slideshowScreens.length : slides.length;
  const {
    arab = [],
    arabTitle,
    engTitle,
    eng = [],
    rom = [],
    _id,
    footnotes = [],
  } = nasheed;
  const isSessionMode = Boolean(sessionMeta);
  const token = localStorage.getItem("token");
  const engWFootnote = [...eng];
  const [counter, setCounter] = useState(0);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mode, setMode] = useState(isMobile ? "scroll" : "presentation");
  const [flashSide, setFlashSide] = useState(null);
  const [openFootnote, setOpenFootnote] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSessionExitDialog, setShowSessionExitDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const currentIndex =
    typeof presentationIndex === "number" ? presentationIndex : counter;
  const slideStep = isSlideBased ? 1 : 2;

  const currentSlideIndex = isSlideBased
    ? currentIndex
    : Math.floor(currentIndex / 2);

  const currentSlide = isSlideshow
    ? slideshowScreens[currentSlideIndex]
    : slides[currentSlideIndex];

  const currentScreen = currentSlideIndex + 1;

  const lastIndex = isSlideBased ? totalScreens : (nasheed.eng || []).length;
  if (!isV2) {
    footnotes.forEach((note, i) => {
      const verseIndex = note.verseIndex;
      const original = engWFootnote[verseIndex] || "";
      const [_start, end] = note.range;

      const supTag =
        mode === "scroll"
          ? `<sup style="cursor:pointer; color:#6faeec; pointer-events:auto; touch-action:manipulation; padding:0 2px;" data-idx="${i}">${
              i + 1
            }</sup>`
          : `<sup>${i + 1}</sup>`;

      // Track offset per verse to avoid interference across verses
      if (!engWFootnote._offsets) {
        engWFootnote._offsets = {};
      }

      if (!engWFootnote._offsets[verseIndex]) {
        engWFootnote._offsets[verseIndex] = 0;
      }

      const offset = engWFootnote._offsets[verseIndex];
      const adjustedEnd = end + offset;

      engWFootnote[verseIndex] =
        original.slice(0, adjustedEnd) + supTag + original.slice(adjustedEnd);

      engWFootnote._offsets[verseIndex] += supTag.length;
    });
  }

  const v2FootnotesByLine = useMemo(() => {
    const map = new Map();

    if (!isV2) return map;

    footnotes.forEach((note, index) => {
      const key = String(note.lineId);

      if (!map.has(key)) {
        map.set(key, []);
      }

      map.get(key).push({
        ...note,
        footnoteIndex: index,
      });
    });

    return map;
  }, [isV2, footnotes]);

  const v2FirstFootnoteSlide = useMemo(() => {
    const firstOccurrence = new Map();

    if (!isV2) return firstOccurrence;

    slides.forEach((slide, slideIndex) => {
      slide.lines.forEach((line) => {
        const notes = v2FootnotesByLine.get(String(line._id)) || [];

        notes.forEach((note) => {
          if (!firstOccurrence.has(note.footnoteIndex)) {
            firstOccurrence.set(note.footnoteIndex, slideIndex);
          }
        });
      });
    });

    return firstOccurrence;
  }, [isV2, slides, v2FootnotesByLine]);

  const Footer = () => {
    const footnoteIdxs = footnotes.map((note) => note.verseIndex);
    const footnoteDivs = [];

    if (
      !(
        footnoteIdxs.includes(currentIndex) ||
        footnoteIdxs.includes(currentIndex + 1)
      )
    ) {
      return;
    }

    for (let i = 0; i < footnotes.length; i++) {
      if (footnotes[i].verseIndex < currentIndex) continue;
      else if (footnotes[i].verseIndex > currentIndex + 1) break;
      else {
        footnoteDivs.push(
          <div key={footnotes[i].content}>
            <sup>{i + 1}</sup> {footnotes[i].content}
          </div>,
        );
      }
    }

    return <div style={{ fontSize: "medium" }}>{footnoteDivs}</div>;
  };

  const buttonStyles = {
    color: "white",
    transition: "background-color 0.3s, transform 0.1s",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    "&:active": {
      transform: "scale(0.9)",
    },
  };

  const updatePresentationIndex = useCallback(
    (nextIndex) => {
      if (typeof presentationIndex === "number") {
        onPresentationIndexChange?.(nextIndex);
      } else {
        setCounter(nextIndex);
      }
    },
    [onPresentationIndexChange, presentationIndex, slideStep, lastIndex],
  );

  const handleSessionAwareCloseRequest = useCallback(() => {
    if (isSessionMode) {
      setShowSessionExitDialog(true);
      return;
    }

    onClose();
  }, [isSessionMode, onClose]);

  const handleUserKeyPress = useCallback(
    (e) => {
      if (disablePresentationControls) {
        if (e.code === "Escape") {
          handleSessionAwareCloseRequest();
        }
        return;
      }

      if (e.code === "ArrowLeft") {
        e.preventDefault();

        updatePresentationIndex(Math.max(0, currentIndex - slideStep));

        setFlashSide("left");
        setTimeout(() => setFlashSide(null), 800);
      }

      if (e.code === "ArrowRight") {
        e.preventDefault();

        if (currentIndex >= lastIndex) {
          // Already on the End of Presentation screen
          handleSessionAwareCloseRequest();
          updatePresentationIndex(0);
        } else {
          // Advance, including to the empty final screen
          updatePresentationIndex(
            Math.min(currentIndex + slideStep, lastIndex),
          );
        }

        setFlashSide("right");
        setTimeout(() => setFlashSide(null), 800);
      }

      if (e.code === "Escape") {
        handleSessionAwareCloseRequest();
        updatePresentationIndex(0);
      }
    },
    [
      currentIndex,
      disablePresentationControls,
      slideStep,
      isV2,
      slides.length,
      eng.length,
      handleSessionAwareCloseRequest,
      updatePresentationIndex,
    ],
  );

  useEffect(() => {
    if (mode === "presentation") {
      window.addEventListener("keydown", handleUserKeyPress);

      return () => {
        window.removeEventListener("keydown", handleUserKeyPress);
      };
    }
  }, [mode, handleUserKeyPress]);

  useEffect(() => {
    const handler = (e) => {
      const footnoteTarget = e.target?.closest?.("sup[data-idx]");

      if (footnoteTarget?.dataset?.idx) {
        e.preventDefault?.();
        e.stopPropagation?.();
        setOpenFootnote(parseInt(footnoteTarget.dataset.idx, 10));
        setAnchorEl(footnoteTarget);
      }
    };

    const container = document.querySelector(".text-container");
    container?.addEventListener("click", handler);
    container?.addEventListener("touchend", handler, { passive: false });
    container?.addEventListener("pointerup", handler);

    return () => {
      container?.removeEventListener("click", handler);
      container?.removeEventListener("touchend", handler);
      container?.removeEventListener("pointerup", handler);
    };
  }, [currentIndex, mode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setMode(forcePresentationMode ? "presentation" : "scroll");
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [forcePresentationMode]);

  useEffect(() => {
    if (forcePresentationMode) {
      setMode("presentation");
    }
  }, [forcePresentationMode]);

  const handleClick = (e) => {
    if (disablePresentationControls) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    if (clickX < rect.width / 2) {
      // Previous slide
      updatePresentationIndex(Math.max(0, currentIndex - slideStep));

      setFlashSide("left");
    } else {
      // Next slide
      if (currentIndex >= lastIndex) {
        handleSessionAwareCloseRequest();
        updatePresentationIndex(0);
      } else {
        updatePresentationIndex(Math.min(currentIndex + slideStep, lastIndex));
      }

      setFlashSide("right");
    }

    setTimeout(() => setFlashSide(null), 800);
  };

  const slideNumber = (currentScreen, totalScreens) => {
    if (currentScreen > totalScreens) return "End of Presentation";
    else {
      return `${currentScreen} / ${totalScreens}`;
    }
  };

  const currentSlideshowSection = (() => {
    if (!isSlideshow || slideshowSections.length === 0) {
      return null;
    }

    let verseCursor = 0;

    for (const section of slideshowSections) {
      const sectionLength = section.verses?.length || 0;
      if (
        currentIndex >= verseCursor &&
        currentIndex < verseCursor + sectionLength
      ) {
        return section;
      }
      verseCursor += sectionLength;
    }

    return slideshowSections[slideshowSections.length - 1] || null;
  })();

  const allowEdit =
    !isMobile &&
    !isSlideshow &&
    _id &&
    (user?.admin || nasheed.creatorId === user?.id);
  const allowSlideshowManage =
    !isMobile &&
    isSlideshow &&
    !isSessionMode &&
    _id &&
    (user?.admin || nasheed.creatorId === user?.id);

  const getSlideshowSectionForVerse = (verseIndex) => {
    if (!isSlideshow || slideshowSections.length === 0) {
      return null;
    }

    let verseCursor = 0;

    for (const section of slideshowSections) {
      const sectionLength = section.verses?.length || 0;

      if (
        verseIndex >= verseCursor &&
        verseIndex < verseCursor + sectionLength
      ) {
        return section;
      }

      verseCursor += sectionLength;
    }

    return null;
  };

  const renderVerseBlock = (verseIndex) => {
    if (verseIndex >= eng.length || verseIndex < 0) {
      return null;
    }

    const layout =
      getSlideshowSectionForVerse(verseIndex)?.layout || "arab-rom-eng";
    const showArab = layout.includes("arab");
    const showRom = layout.includes("rom");
    const showEng = layout.includes("eng");

    return (
      <div className="paragraph">
        {showArab && <p className="arabText">{arab[verseIndex]}</p>}
        {showRom && (
          <p className="engText">
            <em dangerouslySetInnerHTML={{ __html: rom[verseIndex] }} />
          </p>
        )}
        {showEng && (
          <p
            className="engText"
            dangerouslySetInnerHTML={{
              __html: engWFootnote[verseIndex],
            }}
          />
        )}
      </div>
    );
  };

  const handleDeleteSlideshow = async () => {
    if (!token || !_id) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`${baseURL}/slideshow/${_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete slideshow.");
      }

      onSlideshowDeleted(_id);
      setShowDeleteDialog(false);
    } catch (error) {
      setAlertMessage(error.message || "Failed to delete slideshow.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    handleSessionAwareCloseRequest();
  };

  const handleConfirmSessionExit = () => {
    setShowSessionExitDialog(false);

    if (sessionMeta?.isLeader) {
      sessionMeta?.onEndSession?.();
      return;
    }

    sessionMeta?.onLeaveSession?.();
  };

  const renderV2EnglishWithFootnotes = (line, slideIndex) => {
    const text = line.eng || "";
    const notes = (v2FootnotesByLine.get(String(line._id)) || []).filter(
      (note) => v2FirstFootnoteSlide.get(note.footnoteIndex) === slideIndex,
    );

    if (!notes.length) return text;

    const elements = [];
    let cursor = 0;

    // Insert markers after the selected text range.
    const sortedNotes = [...notes].sort((a, b) => a.range[1] - b.range[1]);

    sortedNotes.forEach((note) => {
      const end = Math.max(
        cursor,
        Math.min(text.length, note.range?.[1] ?? text.length),
      );

      elements.push(text.slice(cursor, end));

      elements.push(
        <sup
          key={`footnote-${note.footnoteIndex}`}
          style={{
            cursor: mode === "scroll" ? "pointer" : "default",
            color: mode === "scroll" ? "#6faeec" : "inherit",
            padding: "0 2px",
          }}
          onClick={(e) => {
            e.stopPropagation();

            if (mode !== "scroll") return;

            setOpenFootnote(note.footnoteIndex);
            setAnchorEl(e.currentTarget);
          }}
        >
          {note.footnoteIndex + 1}
        </sup>,
      );

      cursor = end;
    });

    elements.push(text.slice(cursor));

    return elements;
  };

  const renderV2Slide = (slide, slideIndex) => {
    if (!slide) return null;

    return slide.lines.map((line, index) => (
      <div className="paragraph" key={`${line._id}-${index}`}>
        <p className="arabText" dir="rtl">
          {sanitizeArabic(line.arab)}
        </p>

        {line.rom && (
          <p className="engText">
            <em>{line.rom}</em>
          </p>
        )}

        {line.eng && (
          <p className="engText">
            {renderV2EnglishWithFootnotes(line, slideIndex)}
          </p>
        )}
      </div>
    ));
  };

  const renderV2Footer = () => {
    if (!currentSlide) return null;

    const seen = new Set();
    const notes = [];

    currentSlide.lines.forEach((line) => {
      const lineNotes = (v2FootnotesByLine.get(String(line._id)) || []).filter(
        (note) =>
          v2FirstFootnoteSlide.get(note.footnoteIndex) === currentSlideIndex,
      );

      lineNotes.forEach((note) => {
        if (seen.has(note.footnoteIndex)) return;

        seen.add(note.footnoteIndex);
        notes.push(note);
      });
    });

    if (!notes.length) return null;

    return (
      <div style={{ fontSize: "medium" }}>
        {notes.map((note) => (
          <div key={note.footnoteIndex}>
            <sup>{note.footnoteIndex + 1}</sup> {note.content}
          </div>
        ))}
      </div>
    );
  };

  const renderSlideshowScreen = (screen) => {
    if (!screen) return null;

    if (screen.type === "titleIntro") {
      return (
        <Box
          sx={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: 4,
            px: 4,
          }}
        >
          {screen.arabTitle && (
            <Box
              className="arabText"
              dir="rtl"
              sx={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
            >
              {screen.arabTitle}
            </Box>
          )}

          <Box
            sx={{
              color: "white",
              fontSize: "clamp(2rem, 4vw, 4rem)",
              fontWeight: 600,
            }}
          >
            {screen.title}
          </Box>
        </Box>
      );
    }

    if (screen.type === "custom") {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            minHeight: "55vh",
            gap: 3,
            px: 4,
          }}
        >
          {screen.lines.map((line, index) => (
            <div className="paragraph" key={line._id || index}>
              {line.arab?.trim() && (
                <p className="arabText" dir="rtl">
                  {sanitizeArabic(line.arab)}
                </p>
              )}

              {line.rom?.trim() && (
                <p className="engText">
                  <em>{line.rom}</em>
                </p>
              )}

              {line.eng?.trim() && <p className="engText">{line.eng}</p>}
            </div>
          ))}
        </Box>
      );
    }

    const layout = screen.section.layout || "arab-rom-eng";

    return screen.lines.map((line, index) => (
      <div className="paragraph" key={`${screen.key}-${index}`}>
        {layout.includes("arab") && line.arab && (
          <p className="arabText" dir="rtl">
            {sanitizeArabic(line.arab)}
          </p>
        )}

        {layout.includes("rom") && line.rom && (
          <p className="engText">
            <em>{line.rom}</em>
          </p>
        )}

        {layout.includes("eng") && line.eng && (
          <p className="engText">{line.eng}</p>
        )}
      </div>
    ));
  };

  const renderSlideshowReading = () =>
    slideshowSections.map((section, sectionIndex) => {
      const isCustom = section.type === "custom";
      const lines = isCustom ? section.lines || [] : section.verses || [];

      const layout = section.layout || "arab-rom-eng";

      return (
        <div
          className="translation-container"
          key={section.id || section._id || sectionIndex}
        >
          <h2 style={{ textAlign: "center" }}>
            {isCustom ? section.title : section.engTitle}
          </h2>

          {lines.map((line, index) => (
            <div className="paragraph" key={line._id || index}>
              {(isCustom || layout.includes("arab")) && line.arab?.trim() && (
                <p className="arabText" dir="rtl">
                  {sanitizeArabic(line.arab)}
                </p>
              )}

              {(isCustom || layout.includes("rom")) && line.rom?.trim() && (
                <p className="engText">
                  <em>{line.rom}</em>
                </p>
              )}

              {(isCustom || layout.includes("eng")) && line.eng?.trim() && (
                <p className="engText">{line.eng}</p>
              )}
            </div>
          ))}
        </div>
      );
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      onClick={mode === "presentation" ? handleClick : () => {}}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box className="modal">
        <Dialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle>
            Are you sure you want to delete this slideshow?
          </DialogTitle>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowDeleteDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSlideshow}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={showSessionExitDialog}
          onClose={() => setShowSessionExitDialog(false)}
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle>
            {sessionMeta?.isLeader
              ? "Are you sure you want to end the session?"
              : "Are you sure you want to leave the session?"}
          </DialogTitle>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setShowSessionExitDialog(false)}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSessionExit}
              color={sessionMeta?.isLeader ? "error" : "primary"}
              variant="contained"
            >
              {sessionMeta?.isLeader ? "End session" : "Leave session"}
            </Button>
          </DialogActions>
        </Dialog>
        {flashSide === "left" && <div className="flash-overlay left-flash" />}
        {flashSide === "right" && <div className="flash-overlay right-flash" />}
        <div className="modal-left-buttons">
          <IconButton
            sx={buttonStyles}
            onClick={async (e) => {
              if (loadingPDF || pdfFailed) return;
              e.stopPropagation();
              setLoadingPDF(true);
              setPdfGenerated(false);
              setPdfFailed(false);

              try {
                // 1. Trigger PDF generation
                await generatePDF({
                  ...nasheed,
                  arrangedBy: user?.name || "Unknown",
                });

                // 2. Mark generation complete
                setLoadingPDF(false);
                setPdfGenerated(true);

                // 3. Wait 1s for user to see ✅, then reset
                setTimeout(() => setPdfGenerated(false), 1000);
              } catch (err) {
                console.error("PDF generation failed", err);
                setAlertMessage(err.message);
                setShowAlert(true);
                setLoadingPDF(false);
                setPdfFailed(true);
                setTimeout(() => {
                  setPdfFailed(false);
                  setShowAlert(false);
                }, 3000);
              }
            }}
          >
            {loadingPDF ? (
              <CircularProgress size={24} style={{ color: "white" }} />
            ) : pdfGenerated ? (
              <CheckCircleOutline
                fontSize="large"
                style={{ color: "#4caf50" }}
              />
            ) : pdfFailed ? (
              <ErrorOutline fontSize="large" style={{ color: "#f44336" }} />
            ) : (
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
                title="Export as PDF"
              >
                <PictureAsPdf fontSize="large" style={{ color: "white" }} />
              </Tooltip>
            )}
          </IconButton>

          <SnackbarAlert
            open={showAlert}
            onClose={() => setShowAlert(false)}
            message={alertMessage}
            type={"error"}
          />
          {!isMobile && !forcePresentationMode && (
            <>
              <Tooltip
                placement="top"
                title="Presentation Mode"
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
                  sx={buttonStyles}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode("presentation");
                  }}
                >
                  <Tv fontSize="large" style={{ color: "white" }} />
                </IconButton>
              </Tooltip>
              <Tooltip
                placement="top"
                title="Reading Mode"
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
                  sx={buttonStyles}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode("scroll");
                  }}
                >
                  <ArticleOutlined
                    fontSize="large"
                    style={{ color: "white" }}
                  />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
        <div className="modal-right-buttons">
          {isSessionMode && !isMobile && sessionMeta?.onCopyLink && (
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
              title="Copy session link"
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  sessionMeta.onCopyLink();
                }}
                sx={buttonStyles}
              >
                <LinkOutlined fontSize="large" style={{ color: "white" }} />
              </IconButton>
            </Tooltip>
          )}
          {allowSlideshowManage && (
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
              title="Edit slideshow"
            >
              <IconButton
                onClick={(e) => e.stopPropagation()}
                component={Link}
                to={`/create/slideshow/${_id}`}
                sx={buttonStyles}
              >
                <EditNote fontSize="large" style={{ color: "white" }} />
              </IconButton>
            </Tooltip>
          )}
          {allowSlideshowManage && (
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
              title="Delete slideshow"
            >
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                sx={buttonStyles}
              >
                <DeleteOutline fontSize="large" style={{ color: "white" }} />
              </IconButton>
            </Tooltip>
          )}
          {allowEdit && (
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
              title="Edit Nasheed"
            >
              <IconButton
                onClick={(e) => e.stopPropagation()}
                component={Link}
                to={isV2 ? `/${nasheed.slug}` : `/${_id}`}
                sx={buttonStyles}
              >
                <EditNote fontSize="large" style={{ color: "white" }} />
              </IconButton>
            </Tooltip>
          )}
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
              sx={{
                ...buttonStyles,
                marginLeft: allowEdit || allowSlideshowManage ? "0" : "30px",
              }}
              onClick={handleCloseClick}
            >
              <Close fontSize="large" style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
        </div>
        <div className="title">
          {isSlideshow && mode === "presentation" ? (
            <h1>
              <div className="modal-main-title">{engTitle}</div>
              <div className="modal-sub-title">
                {currentSlide?.type === "custom"
                  ? currentSlide.title
                  : currentSlide?.section?.engTitle || arabTitle}
              </div>
              {isSessionMode && (
                <div className="modal-session-meta">
                  Live session {sessionMeta?.sessionCode}
                </div>
              )}
            </h1>
          ) : (
            <h1 className="arabText">
              {arabTitle}
              <br />
              {engTitle}
            </h1>
          )}
        </div>
        {mode === "presentation" ? (
          <>
            <div className="body">
              {isSlideshow ? (
                renderSlideshowScreen(currentSlide)
              ) : isV2 ? (
                renderV2Slide(currentSlide, currentSlideIndex)
              ) : (
                <>
                  {renderVerseBlock(currentIndex)}
                  {renderVerseBlock(currentIndex + 1)}
                </>
              )}
            </div>
            {isSlideshow ? null : isV2 ? renderV2Footer() : <Footer />}
            {sessionMeta?.isOutOfSync && (
              <div className="sync-banner">
                <span>You are out of sync with the leader.</span>
                <button
                  type="button"
                  className="sync-banner-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sessionMeta?.onSyncToLeader?.();
                  }}
                >
                  <SyncOutlined fontSize="inherit" />
                  Sync
                </button>
              </div>
            )}
            <div className="slide-number">
              {slideNumber(currentScreen, totalScreens)}
            </div>
          </>
        ) : (
          <>
            <FootnotePopper
              openFootnote={openFootnote}
              anchorEl={anchorEl}
              setOpenFootnote={setOpenFootnote}
              setAnchorEl={setAnchorEl}
              footnotes={footnotes}
            />
            <div
              style={{ backgroundColor: "inherit", margin: "0 auto" }}
              className="text-container"
            >
              <div style={{ border: "1px dotted white" }} className="body">
                {isSlideshow
                  ? renderSlideshowReading()
                  : isV2
                    ? slides.map((slide, index) => (
                        <div key={index} className="translation-container">
                          {renderV2Slide(slide, index)}
                        </div>
                      ))
                    : nasheedText({
                        arab,
                        eng: engWFootnote,
                        rom,
                      })}
              </div>
            </div>
          </>
        )}
      </Box>
    </Modal>
  );
}
