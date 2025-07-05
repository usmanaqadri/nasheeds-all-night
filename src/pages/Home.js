import { useEffect, useState } from "react";
import Loader from "../components/Loader.js";
import MyModal from "../components/Modal.js";
import NasheedBoard from "../components/NasheedBoard.js";
import Searchbar from "../components/Searchbar.js";
import { baseURL } from "../utils/constants.js";

function Home() {
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
    fetch(`${baseURL}/`)
      .then((res) => res.json())
      .then((data) => {
        setNasheeds([...data.nasheeds].sort(compareFunc));
        setFilteredNasheeds([...data.nasheeds].sort(compareFunc));
        setLoading(false);
      });
  }, []);

  const removeDiacritics = (str) => {
    return str
      .replace(/[Ā]/g, "A")
      .replace(/[ā]/g, "a")
      .replace(/[Ḍ]/g, "D")
      .replace(/[ḍ]/g, "d")
      .replace(/[Ē]/g, "E")
      .replace(/[ē]/g, "e")
      .replace(/[Ḥ]/g, "H")
      .replace(/[ḥ]/g, "h")
      .replace(/[Ī]/g, "I")
      .replace(/[ī]/g, "i")
      .replace(/[Ṅ]/g, "N")
      .replace(/[ṅ]/g, "n")
      .replace(/[Ō]/g, "O")
      .replace(/[ō]/g, "o")
      .replace(/[Ṛ]/g, "R")
      .replace(/[ṛ]/g, "r")
      .replace(/[Ṣ]/g, "S")
      .replace(/[ṣ]/g, "s")
      .replace(/[Ṭ]/g, "T")
      .replace(/[ṭ]/g, "t")
      .replace(/[Ū]/g, "U")
      .replace(/[ū]/g, "u")
      .replace(/[ʾʿ]/g, "'");
  };

  const handleSearch = (search) => {
    let filteredList;
    const regexString = `.*${search}.*`;
    const regex = new RegExp(regexString, "gi");
    filteredList = nasheeds.filter((nasheed) => {
      return removeDiacritics(nasheed.engTitle).match(regex);
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
    <div>
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

export default Home;
