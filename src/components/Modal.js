import React, { useState, useEffect, useCallback } from "react";
import { Box, Modal, IconButton, CircularProgress } from "@mui/material";
import { Link } from "react-router-dom";
import {
  Close,
  PictureAsPdf,
  Tv,
  ArticleOutlined,
  EditNote,
  CheckCircle,
} from "@mui/icons-material";
import "./Modal.css";
import { generatePDF } from "../utils/generatePDF";
import { nasheedText } from "../utils/helperFunctions";
import { useAuth } from "./AuthContext";

export default function MyModal({ open, onClose, nasheed }) {
  const { user } = useAuth();
  let { arab, arabTitle, engTitle, eng, rom, _id } = nasheed;
  const [counter, setCounter] = useState(0);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mode, setMode] = useState(isMobile ? "scroll" : "presentation");
  const [flashSide, setFlashSide] = useState(null);

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
              e.stopPropagation();
              setLoadingPDF(true);

              try {
                await generatePDF(arabTitle, engTitle, arab, eng, rom);
                setLoadingPDF(false);
                setPdfGenerated(true);

                // Show checkmark for 1.5 seconds
                setTimeout(() => {
                  setPdfGenerated(false);
                }, 1500);
              } catch (err) {
                console.error("PDF generation failed", err);
                setLoadingPDF(false);
              }
            }}
          >
            {loadingPDF ? (
              <CircularProgress size={24} style={{ color: "white" }} />
            ) : pdfGenerated ? (
              <CheckCircle fontSize="large" style={{ color: "lightgreen" }} />
            ) : (
              <PictureAsPdf fontSize="large" style={{ color: "white" }} />
            )}
          </IconButton>
          {!isMobile && (
            <>
              <IconButton
                sx={buttonStyles}
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("presentation");
                }}
              >
                <Tv fontSize="large" style={{ color: "white" }} />
              </IconButton>
              <IconButton
                sx={buttonStyles}
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("scroll");
                }}
              >
                <ArticleOutlined fontSize="large" style={{ color: "white" }} />
              </IconButton>
            </>
          )}
        </div>
        <div className="modal-right-buttons">
          {allowEdit && (
            <IconButton
              onClick={(e) => e.stopPropagation()}
              component={Link}
              to={`/${_id}`}
              sx={buttonStyles}
            >
              <EditNote fontSize="large" style={{ color: "white" }} />
            </IconButton>
          )}
          <IconButton
            sx={{ ...buttonStyles, marginLeft: allowEdit ? "0" : "30px" }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <Close fontSize="large" style={{ color: "white" }} />
          </IconButton>
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
                <p className="engText">
                  <em dangerouslySetInnerHTML={{ __html: rom[counter] }} />
                </p>
                <p className="engText">{eng[counter]}</p>
              </div>
              <div className="paragraph">
                <p className="arabText">{arab[counter + 1]}</p>
                <p className="engText">
                  <em dangerouslySetInnerHTML={{ __html: rom[counter + 1] }} />
                </p>
                <p className="engText">{eng[counter + 1]}</p>
              </div>
            </div>
            <div className="slide-number">
              {slideNumber(currentScreen, totalScreens)}
            </div>
          </>
        ) : (
          <div
            style={{ backgroundColor: "inherit", margin: "0 auto" }}
            className="container"
          >
            <div style={{ border: "1px dotted white" }} className="body">
              {nasheedText(nasheed)}
            </div>
          </div>
        )}
      </Box>
    </Modal>
  );
}
