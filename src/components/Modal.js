import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Modal,
  IconButton,
  CircularProgress,
  Tooltip,
  Typography,
  Popper,
  Paper,
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
} from "@mui/icons-material";
import "./Modal.css";
import { generatePDF } from "../utils/generatePDF";
import { nasheedText, SnackbarAlert } from "../utils/helperFunctions";
import { useAuth } from "./AuthContext";

export default function MyModal({ open, onClose, nasheed }) {
  const { user } = useAuth();
  let { arab, arabTitle, engTitle, eng, rom, _id, footnotes } = nasheed;
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
  footnotes.forEach((note, i) => {
    const original = engWFootnote[note.verseIndex] || "";
    const [_start, end] = note.range;

    const supTag =
      mode === "scroll"
        ? `<sup style="cursor:pointer; color:#6faeec" data-idx="${i}">${
            i + 1
          }</sup>`
        : `<sup>${i + 1}</sup>`;

    engWFootnote[note.verseIndex] =
      original.slice(0, end) + supTag + original.slice(end);
  });

  const Footer = () => {
    const footnoteIdxs = footnotes.map((note) => note.verseIndex);
    const footnoteDivs = [];

    if (
      !(footnoteIdxs.includes(counter) || footnoteIdxs.includes(counter + 1))
    ) {
      return;
    }

    for (let i = 0; i < footnotes.length; i++) {
      if (footnotes[i].verseIndex < counter) continue;
      else if (footnotes[i].verseIndex > counter + 1) break;
      else {
        footnoteDivs.push(
          <div key={footnotes[i].content}>
            <sup>{i + 1}</sup> {footnotes[i].content}
          </div>
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

  const handleUserKeyPress = useCallback(
    (e) => {
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (counter === 0) setCounter(0);
        else setCounter(counter - 2);
        setFlashSide("left");
        setTimeout(() => setFlashSide(null), 800);
      }
      if (e.code === "ArrowRight") {
        if (counter === eng.length) {
          onClose();
          setCounter(0);
        } else {
          setCounter(counter + 2);
        }
        setFlashSide("right");
        setTimeout(() => setFlashSide(null), 800);
      }
      if (e.code === "Escape") {
        onClose();
        setCounter(0);
      }
    },
    [counter, eng.length, onClose]
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
  }, [counter, mode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setMode("scroll");
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClick = (e) => {
    const clickTarget = e.target;
    const clickTargetWidth = clickTarget.offsetWidth;
    const xCoordInClickTarget =
      e.clientX - clickTarget.getBoundingClientRect().left;
    if (clickTargetWidth / 2 > xCoordInClickTarget) {
      e.preventDefault();
      if (counter === 0) setCounter(0);
      else setCounter(counter - 2);

      setFlashSide("left");
    } else {
      if (counter === eng.length) {
        onClose();
        setCounter(0);
      } else {
        setCounter(counter + 2);
      }
      setFlashSide("right");
    }

    setTimeout(() => setFlashSide(null), 800);
  };

  const totalScreens = Math.ceil(eng.length / 2);
  const currentScreen = Math.floor(counter / 2) + 1;

  const slideNumber = (currentScreen, totalScreens) => {
    if (currentScreen > totalScreens) return "End of Presentation";
    else {
      return `${currentScreen} / ${totalScreens}`;
    }
  };

  const allowEdit =
    !isMobile && (user?.admin || nasheed.creatorId === user?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      onClick={mode === "presentation" ? handleClick : () => {}}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box className="modal">
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
                await generatePDF(arabTitle, engTitle, arab, eng, rom);

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
          {!isMobile && (
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
              sx={{ ...buttonStyles, marginLeft: allowEdit ? "0" : "30px" }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <Close fontSize="large" style={{ color: "white" }} />
            </IconButton>
          </Tooltip>
        </div>
        <div className="title">
          <h1 className="arabText">
            {arabTitle}
            <br />
            {engTitle}
          </h1>
        </div>
        {mode === "presentation" ? (
          <>
            <div className="body">
              <div className="paragraph">
                <p className="arabText">{arab[counter]}</p>
                <p
                  className="engText"
                  dangerouslySetInnerHTML={{
                    __html: engWFootnote[counter],
                  }}
                />
              </div>
              <div className="paragraph">
                <p className="arabText">{arab[counter + 1]}</p>
                <p className="engText">
                  <em dangerouslySetInnerHTML={{ __html: rom[counter + 1] }} />
                </p>
                <p
                  className="engText"
                  dangerouslySetInnerHTML={{
                    __html: engWFootnote[counter + 1],
                  }}
                />
              </div>
            </div>
            <Footer />
            <div className="slide-number">
              {slideNumber(currentScreen, totalScreens)}
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
                    ? footnotes[openFootnote]?.content
                    : ""}
                </Typography>
              </Paper>
            </Popper>

            <div
              style={{ backgroundColor: "inherit", margin: "0 auto" }}
              className="text-container"
            >
              <div style={{ border: "1px dotted white" }} className="body">
                {nasheedText({ arab, eng: engWFootnote, rom })}
              </div>
            </div>
          </>
        )}
      </Box>
    </Modal>
  );
}
