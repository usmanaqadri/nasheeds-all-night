import { useEffect, useState } from "react";
import { Box, Button, Tab, Tabs, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
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
import { buildSlideshowModalData } from "../utils/slideshowHelpers.js";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nasheeds, setNasheeds] = useState([]);
  const [filteredNasheeds, setFilteredNasheeds] = useState([]);
  const [slideshows, setSlideshows] = useState([]);
  const [filteredSlideshows, setFilteredSlideshows] = useState([]);
  const [activeTab, setActiveTab] = useState("nasheeds");
  const [nasheedId, setNasheedId] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [sessionCode, setSessionCode] = useState("");

  useEffect(() => {
    let queryParam = "";
    if (user?.id) {
      queryParam = `?userId=${user?.id}`;
    }

    const fetchNasheeds = async () => {
      try {
        const requests = [fetch(`${baseURL}/nasheed${queryParam}`)];

        if (user?.id) {
          requests.push(fetch(`${baseURL}/slideshow?userId=${user.id}`));
        }

        const responses = await Promise.all(requests);
        const [nasheedResponse, slideshowResponse] = responses;
        const nasheedData = await nasheedResponse.json();

        if (!nasheedResponse.ok) {
          throw new Error(nasheedData.message || "Failed to fetch nasheeds");
        }

        const { nasheeds } = nasheedData;

        const sorted = [...nasheeds].sort(alphabetize);
        const nasheedMap = sorted.reduce((accumulator, nasheed) => {
          accumulator[nasheed._id] = nasheed;
          return accumulator;
        }, {});
        let hydratedSlideshows = [];

        if (slideshowResponse) {
          const slideshowData = await slideshowResponse.json();
          if (!slideshowResponse.ok) {
            throw new Error(
              slideshowData.message || "Failed to fetch slideshows",
            );
          }
          hydratedSlideshows = (slideshowData.slideshows || []).map((slideshow) =>
            buildSlideshowModalData(slideshow, nasheedMap),
          );
        }

        setNasheeds(sorted);
        setFilteredNasheeds(sorted);
        setSlideshows(hydratedSlideshows);
        setFilteredSlideshows(hydratedSlideshows);
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
    const regexString = `.*${search}.*`;
    const regex = new RegExp(regexString, "gi");
    const filteredNasheedList = nasheeds.filter((nasheed) =>
      removeDiacritics(nasheed.engTitle).match(regex),
    );
    const filteredSlideshowList = slideshows.filter((slideshow) =>
      removeDiacritics(slideshow.engTitle).match(regex),
    );
    setFilteredNasheeds(filteredNasheedList);
    setFilteredSlideshows(filteredSlideshowList);
  };

  const handleClick = (index) => () => {
    setNasheedId(index);
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };

  const handleJoinSession = () => {
    const trimmedCode = sessionCode.trim();

    if (!trimmedCode) {
      setAlertMessage("Enter a session code first.");
      setShowAlert(true);
      return;
    }

    navigate(`/session/${trimmedCode}`);
  };

  const handleSlideshowDeleted = (deletedId) => {
    setSlideshows((prev) => prev.filter((slideshow) => slideshow._id !== deletedId));
    setFilteredSlideshows((prev) =>
      prev.filter((slideshow) => slideshow._id !== deletedId),
    );
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
          <Box
            sx={{
              width: "fit-content",
              margin: "0 auto 12px",
              backgroundColor: "rgba(255,255,255,0.88)",
              borderRadius: "16px",
              padding: "6px",
              boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{
                minHeight: "unset",
                "& .MuiTab-root": {
                  textTransform: "none",
                  minHeight: "unset",
                  borderRadius: "12px",
                  fontWeight: 600,
                  fontSize: "1rem",
                },
              }}
              TabIndicatorProps={{ style: { display: "none" } }}
            >
              <Tab
                value="nasheeds"
                label="Nasheeds"
                sx={{
                  color: activeTab === "nasheeds" ? "#fff !important" : "#1f2a44",
                  backgroundColor:
                    activeTab === "nasheeds" ? "#1f4b99" : "transparent",
                }}
              />
              <Tab
                value="slideshows"
                label="Slideshows"
                sx={{
                  color:
                    activeTab === "slideshows" ? "#fff !important" : "#1f2a44",
                  backgroundColor:
                    activeTab === "slideshows" ? "#1f4b99" : "transparent",
                }}
              />
            </Tabs>
          </Box>
          <Searchbar
            onSearch={handleSearch}
            placeholder={
              activeTab === "nasheeds"
                ? "Search for a nasheed"
                : "Search for a slideshow"
            }
          />
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "center",
              alignItems: "center",
              mt: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              label="Join live session"
              placeholder="Enter session code"
              value={sessionCode}
              onChange={(event) => setSessionCode(event.target.value)}
              size="small"
              sx={{
                minWidth: { xs: "260px", sm: "320px" },
                backgroundColor: "rgba(255,255,255,0.92)",
                borderRadius: 2,
              }}
            />
            <Button variant="contained" onClick={handleJoinSession}>
              Join
            </Button>
          </Box>
          <NasheedBoard
            nasheeds={
              activeTab === "nasheeds" ? filteredNasheeds : filteredSlideshows
            }
            onClick={handleClick}
          />
        </>
      )}
      {isOpen && (
        <MyModal
          open={isOpen}
          onClose={handleClose}
          onSlideshowDeleted={handleSlideshowDeleted}
          nasheed={
            activeTab === "nasheeds"
              ? filteredNasheeds[nasheedId]
              : filteredSlideshows[nasheedId]
          }
        />
      )}
    </div>
  );
};

export default Home;
