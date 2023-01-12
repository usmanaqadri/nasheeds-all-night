import React, { useState, useEffect } from "react";
import "./App.css";
import MyModal from "./components/Modal.js";
import Header from "./components/Header.js";
import NasheedBoard from "./components/NasheedBoard.js";
import Loader from "./components/Loader";

function App() {
  const [nasheeds, setNasheeds] = useState([]);
  const [nasheedId, setNasheedId] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3001"
          : process.env.REACT_APP_API
      }/nasheed/`
    )
      .then((res) => res.json())
      .then((data) =>
        setNasheeds(
          [...data.nasheeds].sort((a, b) =>
            a.engTitle
              .replace(/Ṣ/g, "S")
              .replace(/Ṭ/g, "T")
              .replace(/ʿ/g, "")
              .replace(/Ā/g, "A")
              .replace(/Ḥ/g, "H")
              .replace(/Ī/g, "I") >
            b.engTitle
              .replace(/Ṣ/g, "S")
              .replace(/Ṭ/g, "T")
              .replace(/ʿ/g, "")
              .replace(/Ā/g, "A")
              .replace(/Ḥ/g, "H")
              .replace(/Ī/g, "I")
              ? 1
              : -1
          )
        )
      );
  }, []);

  const handleClick = (index) => () => {
    setNasheedId(index);
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };
  return (
    <div className="App">
      <Header />
      {nasheeds.length === 0 ? (
        <Loader />
      ) : (
        <NasheedBoard nasheeds={nasheeds} onClick={handleClick} />
      )}
      {isOpen && (
        <MyModal
          open={isOpen}
          onClose={handleClose}
          text={nasheeds[nasheedId]}
        />
      )}
    </div>
  );
}

export default App;
