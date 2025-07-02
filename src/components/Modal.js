import React, { useState, useEffect } from "react";
import { Box, Modal, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import { Close, PictureAsPdf } from "@mui/icons-material";
import "./Modal.css";

const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/v1/nasheed"
    : "/api/v1/nasheed";

const generatePDF = async (
  arabTitle,
  engTitle,
  arabicArray,
  englishArray,
  transliterationArray
) => {
  const cleanedArabicTitle = arabTitle.replace(/\r/g, "").trim();
  const cleanedEnglishTitle = engTitle.replace(/\r/g, "").trim();
  const cleanedArabicArray = arabicArray.map((str) =>
    str.replace(/\r/g, "").trim()
  );
  const cleanedEnglishArray = englishArray.map((str) =>
    str.replace(/\r/g, "").trim()
  );
  const cleanedTransliterationArray = transliterationArray.map((str) =>
    str.replace(/\r/g, "").trim()
  );

  const response = await fetch(`${baseURL}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      arabicTitle: cleanedArabicTitle,
      engTitle: cleanedEnglishTitle,
      arabicArray: cleanedArabicArray,
      englishArray: cleanedEnglishArray,
      transliterationArray: cleanedTransliterationArray,
    }),
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${cleanedEnglishTitle}.pdf`;
  link.click();
};

export default function MyModal({ open, onClose, text }) {
  let { arab, arabTitle, engTitle, eng, rom, _id } = text;
  const [counter, setCounter] = useState(0);
  const handleUserKeyPress = (e) => {
    if (e.code === "ArrowLeft") {
      e.preventDefault();
      if (counter === 0) setCounter(0);
      else setCounter(counter - 2);
    }
    if (e.code === "ArrowRight") {
      if (counter === eng.length) {
        onClose();
        setCounter(0);
      } else {
        setCounter(counter + 2);
      }
    }
    if (e.code === "Escape") {
      onClose();
      setCounter(0);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);

    return () => {
      window.removeEventListener("keydown", handleUserKeyPress);
    };
  });
  const handleClick = (e) => {
    const clickTarget = e.target;
    const clickTargetWidth = clickTarget.offsetWidth;
    const xCoordInClickTarget =
      e.clientX - clickTarget.getBoundingClientRect().left;
    if (clickTargetWidth / 2 > xCoordInClickTarget) {
      e.preventDefault();
      if (counter === 0) setCounter(0);
      else setCounter(counter - 2);
    } else {
      if (counter === eng.length) {
        onClose();
        setCounter(0);
      } else {
        setCounter(counter + 2);
      }
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      onClick={handleClick}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box className="modal">
        <IconButton
          className="pdf-button"
          onClick={(e) => {
            e.stopPropagation();
            generatePDF(arabTitle, engTitle, arab, eng, rom);
          }}
        >
          <PictureAsPdf fontSize="large" style={{ color: "white" }} />
        </IconButton>
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
      </Box>
    </Modal>
  );
}
