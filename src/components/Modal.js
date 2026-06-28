/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
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
  let { arab, arabTitle, engTitle, eng, rom, _id, footnotes = [] } = nasheed;
  const isSlideshow = nasheed?.type === "slideshow";
  const slideshowSections = nasheed?.slides || [];
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
  footnotes.forEach((note, i) => {
    const verseIndex = note.verseIndex;
    const original = engWFootnote[verseIndex] || "";
    const [_start, end] = note.range;

    const supTag =
      mode === "scroll"
        ? `<sup style="cursor:pointer; color:#6faeec" data-idx="${i}">${
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

  const Footer = () => {
    const footnoteIdxs = footnotes.map((note) => note.verseIndex);
    const footnoteDivs = [];

    if (
      !(footnoteIdxs.includes(currentIndex) ||
        footnoteIdxs.includes(currentIndex + 1))
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
    [onPresentationIndexChange, presentationIndex]
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
        if (currentIndex === 0) updatePresentationIndex(0);
        else updatePresentationIndex(currentIndex - 2);
        setFlashSide("left");
        setTimeout(() => setFlashSide(null), 800);
      }
      if (e.code === "ArrowRight") {
        if (currentIndex === eng.length) {
          handleSessionAwareCloseRequest();
          updatePresentationIndex(0);
        } else {
          updatePresentationIndex(currentIndex + 2);
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
      eng.length,
      handleSessionAwareCloseRequest,
      updatePresentationIndex,
    ]
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
      const target = e.target;
      if (target.tagName === "SUP" && target.dataset.idx) {
        setOpenFootnote(parseInt(target.dataset.idx));
        setAnchorEl(target);
      }
    };

    const container = document.querySelector(".text-container");
    container?.addEventListener("click", handler);

    return () => container?.removeEventListener("click", handler);
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
    if (disablePresentationControls) {
      return;
    }

    const clickTarget = e.target;
    const clickTargetWidth = clickTarget.offsetWidth;
    const xCoordInClickTarget =
      e.clientX - clickTarget.getBoundingClientRect().left;
    if (clickTargetWidth / 2 > xCoordInClickTarget) {
      e.preventDefault();
      if (currentIndex === 0) updatePresentationIndex(0);
      else updatePresentationIndex(currentIndex - 2);

      setFlashSide("left");
    } else {
      if (currentIndex === eng.length) {
        handleSessionAwareCloseRequest();
        updatePresentationIndex(0);
      } else {
        updatePresentationIndex(currentIndex + 2);
      }
      setFlashSide("right");
    }

    setTimeout(() => setFlashSide(null), 800);
  };

  const totalScreens = Math.ceil(eng.length / 2);
  const currentScreen = Math.floor(currentIndex / 2) + 1;

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
      if (currentIndex >= verseCursor && currentIndex < verseCursor + sectionLength) {
        return section;
      }
      verseCursor += sectionLength;
    }

    return slideshowSections[slideshowSections.length - 1] || null;
  })();

  const allowEdit =
    !isMobile && !isSlideshow && _id && (user?.admin || nasheed.creatorId === user?.id);
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

      if (verseIndex >= verseCursor && verseIndex < verseCursor + sectionLength) {
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
                await generatePDF(
                  arabTitle,
                  engTitle,
                  arab,
                  eng,
                  rom,
                  footnotes,
                );

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
                to={`/${_id}`}
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
                {currentSlideshowSection?.engTitle || arabTitle}
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
              {renderVerseBlock(currentIndex)}
              {renderVerseBlock(currentIndex + 1)}
            </div>
            <Footer />
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
                  ? eng.map((_, verseIndex) => (
                      <div key={`${engTitle}-${verseIndex}`} className="translation-container">
                        {renderVerseBlock(verseIndex)}
                      </div>
                    ))
                  : nasheedText({ arab, eng: engWFootnote, rom })}
              </div>
            </div>
          </>
        )}
      </Box>
    </Modal>
  );
}
