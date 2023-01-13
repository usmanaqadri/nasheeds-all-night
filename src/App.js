import React, { useState, useEffect } from "react";
import "./App.css";
import MyModal from "./components/Modal.js";
import Header from "./components/Header.js";
import NasheedBoard from "./components/NasheedBoard.js";
import Loader from "./components/Loader";
import Searchbar from "./components/Searchbar";

function App() {
  const [loading, setLoading] = useState(true);
  const [nasheeds, setNasheeds] = useState([]);
  const [filteredNasheeds, setFilteredNasheeds] = useState([]);
  const [nasheedId, setNasheedId] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const compareFunc = (a, b) =>
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
      : -1;
  useEffect(() => {
    fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3001"
          : process.env.REACT_APP_API
      }/nasheed/`
    )
      .then((res) => res.json())
      .then((data) => {
        setNasheeds([...data.nasheeds].sort(compareFunc));
        setFilteredNasheeds([...data.nasheeds].sort(compareFunc));
        setLoading(false);
      });
  }, []);

  const handleSearch = (search) => {
    let filteredList;
    const regexString = `.*${search}.*`;
    const regex = new RegExp(regexString, "gi");
    filteredList = nasheeds.filter((nasheed) => {
      return nasheed.engTitle.match(regex);
    });
    setFilteredNasheeds(filteredList);
  };

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
      {loading ? (
        <Loader />
      ) : (
        <>
          <Searchbar onSearch={handleSearch} />
          <NasheedBoard nasheeds={filteredNasheeds} onClick={handleClick} />
        </>
      )}
      {isOpen && (
        <MyModal
          open={isOpen}
          onClose={handleClose}
          text={filteredNasheeds[nasheedId]}
        />
      )}
    </div>
  );
}

export default App;
