import React, { useState } from "react";
import { Box, TextField, Button, Grid } from "@mui/material";
import { baseURL } from "../utils/constants";
import { SnackbarAlert } from "../utils/helperFunctions";

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
  lyrics: {
    "& .MuiInputBase-inputMultiline": {
      fontSize: "1.5rem",
      overflow: "auto !important",
      maxHeight: "300px",
      resize: "none",
    },
    "& .MuiInputLabel-root": { fontSize: "1.5rem" },
    "& .MuiFormLabel-root": { fontSize: "1.5rem" },
    "& .MuiInputBase-root": { fontSize: "1.5rem" },
  },
  submitButton: { width: "20%", mx: "auto", padding: 1, fontSize: "1.5rem" },
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNasheedText((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let errorFound = false;

    const formattedData = {
      ...nasheedText,
      arab: nasheedText.arab.split("\n").filter((line) => line.trim() !== ""),
      rom: nasheedText.rom.split("\n").filter((line) => line.trim() !== ""),
      eng: nasheedText.eng.split("\n").filter((line) => line.trim() !== ""),
    };

    fetch(`${baseURL}/`, {
      method: "POST",
      body: JSON.stringify(formattedData),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        errorFound = true;
        return response.json();
      })
      .then((res) => {
        if (errorFound) {
          if (res.code === 11000) {
            setAlert({
              type: "failure",
              message: "Nasheed with same name already exists",
            });
          } else {
            setAlert({ type: "failure", message: res.message });
          }
        } else {
          setAlert({
            type: "success",
            message: "Successfully created nasheed!",
          });
        }
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
      });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={styles.formContainer}>
      <SnackbarAlert
        open={showAlert}
        onClose={() => setShowAlert(false)}
        message={alert.message}
        type={alert.type}
      />{" "}
      <TextField
        label="Arabic Title"
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
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            label="Arabic/Urdu verses (one per line)"
            name="arab"
            value={nasheedText.arab}
            onChange={handleChange}
            multiline
            minRows={10}
            fullWidth
            sx={styles.lyrics}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Transliteration verses (one per line)"
            name="rom"
            value={nasheedText.rom}
            onChange={handleChange}
            multiline
            minRows={10}
            fullWidth
            sx={styles.lyrics}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="English verses (one per line)"
            name="eng"
            value={nasheedText.eng}
            onChange={handleChange}
            multiline
            minRows={10}
            fullWidth
            sx={styles.lyrics}
          />
        </Grid>
      </Grid>
      <Button variant="contained" type="submit" sx={styles.submitButton}>
        Submit
      </Button>
    </Box>
  );
};
