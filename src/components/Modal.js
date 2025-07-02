import React, { useState, useEffect, useCallback } from "react";
import { Box, Modal, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import { Close, PictureAsPdf, Tv, ArticleOutlined } from "@mui/icons-material";
import "./Modal.css";
import { generatePDF } from "../utils/generatePDF";
import { nasheedText } from "../utils/helperFunctions";

export default function MyModal({ open, onClose, text }) {
  let { arab, arabTitle, engTitle, eng, rom, _id } = text;
  const [counter, setCounter] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mode, setMode] = useState(isMobile ? "scroll" : "presentation");
  const [flashSide, setFlashSide] = useState(null);

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
        setMode("scroll"); // 🔥 Automatically switch to scroll
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
        <div className="modal-buttons">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              generatePDF(arabTitle, engTitle, arab, eng, rom);
            }}
          >
            <PictureAsPdf fontSize="large" style={{ color: "white" }} />
          </IconButton>
          {!isMobile && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setMode("presentation");
                }}
              >
                <Tv fontSize="large" style={{ color: "white" }} />
              </IconButton>
              <IconButton
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
        <IconButton className="close-button" onClick={onClose}>
          <Close fontSize="large" style={{ color: "white" }} />
        </IconButton>
        <div className="title">
          <h1 className="arabText">
            <Link
              style={{ textDecoration: "none", color: "inherit" }}
              to={`/${_id}`}
            >
              {arabTitle}
            </Link>
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
            <div
              style={{
                fontSize: "2rem",
                textAlign: "right",

                color: "white",
              }}
            >
              {slideNumber(currentScreen, totalScreens)}
            </div>
          </>
        ) : (
          <div
            style={{ backgroundColor: "inherit", margin: "0 auto" }}
            className="container"
          >
            <div style={{ border: "1px dotted white" }} className="body">
              {nasheedText(text)}
            </div>
          </div>
        )}
      </Box>
    </Modal>
  );
}
