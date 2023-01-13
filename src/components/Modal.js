import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { Link } from "react-router-dom";
import "./Modal.css";

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
        <div className="title">
          <h1 className="arabText">
            <Link
              style={{ textDecoration: "none", color: "inherit" }}
              to={`/nasheeds-all-night/${_id}`}
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
