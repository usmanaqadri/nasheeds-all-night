import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Modal.css";

export default function MyModal({ open, onClose, nasheed }) {
  let { arab, arabTitle, engTitle, eng, rom, _id } = nasheed;
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
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} className="overlay" />
      <div onClick={handleClick} className="modal">
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
      </div>
    </>
  );
}
