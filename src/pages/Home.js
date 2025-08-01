import { useEffect, useState } from "react";
import Loader from "../components/Loader.js";
import MyModal from "../components/Modal.js";
import NasheedBoard from "../components/NasheedBoard.js";
import Searchbar from "../components/Searchbar.js";
import { baseURL } from "../utils/constants.js";
import { useAuth } from "../components/AuthContext.js";
import SeoHelmet from "../components/SeoHelmet.js";
import {
  alphabetize,
  removeDiacritics,
  SnackbarAlert,
} from "../utils/helperFunctions.js";

const Home = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nasheeds, setNasheeds] = useState([]);
  const [filteredNasheeds, setFilteredNasheeds] = useState([]);
  const [nasheedId, setNasheedId] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    let queryParam = "";
    if (user?.id) {
      queryParam = `?userId=${user?.id}`;
    }

    const fetchNasheeds = async () => {
      try {
        const response = await fetch(`${baseURL}/nasheed${queryParam}`);
        const { nasheeds } = await response.json();

        const sorted = [...nasheeds].sort(alphabetize);

        setNasheeds(sorted);
        setFilteredNasheeds(sorted);
      } catch (error) {
        console.error("Failed to fetch nasheeds:", error);
        setAlertMessage(error.message || "Failed to fetch nasheeds");
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
        }, 3000);
      }
      setLoading(false);
    };

    fetchNasheeds();
  }, [user?.id]);

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
      <SeoHelmet
        title={"Discover, Read, and Add Beautiful Nasheeds"}
        description={`Explore spiritually enriching nasheeds across languages. View, edit, and contribute`}
        url={`https://dhikrpedia.com`}
        type="website"
      />
      {loading ? (
        <Loader />
      ) : (
        <>
          <SnackbarAlert
            open={showAlert}
            onClose={() => setShowAlert(false)}
            type={"error"}
            message={alertMessage}
          />
          <Searchbar onSearch={handleSearch} />
          <NasheedBoard nasheeds={filteredNasheeds} onClick={handleClick} />
        </>
      )}
      {isOpen && (
        <MyModal
          open={isOpen}
          onClose={handleClose}
          nasheed={filteredNasheeds[nasheedId]}
        />
      )}
    </div>
  );
};

export default Home;
