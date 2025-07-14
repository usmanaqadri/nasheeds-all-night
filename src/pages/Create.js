import React, { useState } from "react";
import { Box, TextField, Button, Grid } from "@mui/material";
import { baseURL } from "../utils/constants";
import { SnackbarAlert } from "../utils/helperFunctions";
import { useAuth } from "../components/AuthContext";
import SeoHelmet from "../components/SeoHelmet";

const styles = {
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    maxWidth: "80vw",
    margin: "0 auto",
    height: "75vh",
    padding: "20px",
    overflowY: "auto",
  },
  title: {
    width: "33%",
    minWidth: "250px",
    mx: "auto",
    "& .MuiInputBase-input": { fontSize: "1.5rem" },
    "& .MuiInputLabel-root": { fontSize: "1.5rem" },
    "& .MuiFormLabel-root": { fontSize: "1.5rem" },
    "& .MuiInputBase-root": { fontSize: "1.5rem" },
  },
  gridContainer: {
    flexGrow: 1,
    alignItems: "stretch",
  },
  gridItem: {
    display: "flex",
    flexDirection: "column",
  },
  lyrics: {
    height: "100%",
    display: "flex",
    flexDirection: "column",

    "& .MuiInputBase-root": {
      fontSize: "1.5rem",
      height: "100%",
      display: "flex",
      alignItems: "flex-start",
    },
    "& .MuiInputBase-input.MuiInputBase-inputMultiline": {
      fontSize: "1.5rem",
      overflow: "auto",
      height: "100%",
      resize: "none",
      paddingTop: "14px",
      boxSizing: "border-box",
    },
    "& .MuiInputLabel-root": {
      fontSize: "1.5rem",
    },
    "& .MuiFormLabel-root": {
      fontSize: "1.5rem",
    },
  },

  submitButton: {
    width: "40%",
    maxWidth: "200px",
    mx: "auto",
    padding: 1,
    fontSize: "1.5rem",
  },
};

export const Create = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [nasheedText, setNasheedText] = useState({
    arabTitle: "",
    engTitle: "",
    arab: "",
    rom: "",
    eng: "",
  });
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNasheedText((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setAlert({
        type: "error",
        message: "You must be logged in to create a nasheed.",
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    const formattedData = {
      ...nasheedText,
      arab: nasheedText.arab.split("\n").filter((line) => line.trim() !== ""),
      rom: nasheedText.rom.split("\n").filter((line) => line.trim() !== ""),
      eng: nasheedText.eng.split("\n").filter((line) => line.trim() !== ""),
      creatorId: user?.id,
      isPublic: false,
    };

    try {
      const response = await fetch(`${baseURL}/nasheed/create`, {
        method: "POST",
        body: JSON.stringify(formattedData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await response.json();

      if (!response.ok) {
        if (res.code === 11000) {
          setAlert({
            type: "error",
            message: "Nasheed with same name already exists.",
          });
        } else {
          setAlert({
            type: "error",
            message: res.message || "Failed to create nasheed.",
          });
        }
      } else {
        setAlert({
          type: "success",
          message: "Successfully created nasheed!",
        });
        setNasheedText({
          arabTitle: "",
          engTitle: "",
          arab: "",
          rom: "",
          eng: "",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: "Network error occurred. Please try again.",
      });
    }
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  return (
    <>
      <SeoHelmet
        title={"Add your own favorite nasheed to our collection."}
        description={`Add your own nasheed with Arabic, transliteration, and English translation.`}
        url={`https://dhikrpedia.com/create`}
        type="website"
      />
      <Box component="form" onSubmit={handleSubmit} sx={styles.formContainer}>
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />{" "}
        <TextField
          label="Arabic/Urdu Title"
          name="arabTitle"
          value={nasheedText.arabTitle}
          onChange={handleChange}
          required
          sx={styles.title}
        />
        <TextField
          label="English Title"
          name="engTitle"
          value={nasheedText.engTitle}
          onChange={handleChange}
          required
          sx={styles.title}
        />
        <Grid container spacing={2} sx={styles.gridContainer}>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <TextField
              label="Arabic/Urdu verses (one per line)"
              name="arab"
              value={nasheedText.arab}
              onChange={handleChange}
              multiline
              minRows={10}
              sx={styles.lyrics}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <TextField
              label="Transliteration verses (one per line)"
              name="rom"
              value={nasheedText.rom}
              onChange={handleChange}
              multiline
              minRows={10}
              sx={styles.lyrics}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={styles.gridItem}>
            <TextField
              label="English verses (one per line)"
              name="eng"
              value={nasheedText.eng}
              onChange={handleChange}
              multiline
              minRows={10}
              sx={styles.lyrics}
            />
          </Grid>
        </Grid>
        <Button variant="contained" type="submit" sx={styles.submitButton}>
          Submit
        </Button>
      </Box>
    </>
  );
};
