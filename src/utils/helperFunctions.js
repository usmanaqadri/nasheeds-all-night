import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Snackbar, Alert as MuiAlert } from "@mui/material";
import { baseURL } from "./constants";
import { Button, Menu, MenuItem, Box } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export const nasheedText = (nasheed) =>
  nasheed.arab?.map((arab, index) => {
    return (
      <div key={index}>
        <p>{arab}</p>
        <p>
          <em dangerouslySetInnerHTML={{ __html: nasheed.rom[index] }} />
        </p>
        <p>{nasheed.eng[index]}</p>
      </div>
    );
  });

export const handleGoogleLogin = async (credentialResponse, setLoggedIn) => {
  const googleToken = credentialResponse.credential;

  try {
    const res = await fetch(`${baseURL}/user/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: googleToken }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      setLoggedIn(true);
    } else {
      console.log("login failed: ", data.message);
    }

    console.log("here is decoded jwt", jwtDecode(data.token));
  } catch (error) {
    console.log("network error: ", error);
  }
};

export const SnackbarAlert = ({ type, message, open, onClose }) => {
  const severityMap = {
    success: "success",
    failure: "error",
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <MuiAlert
        onClose={onClose}
        severity={severityMap[type] || "success"}
        variant="filled"
        sx={{ fontSize: "1.2rem" }}
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

export const UserMenu = ({ name, onSignOut, darkMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    handleClose();
    onSignOut();
  };

  return (
    <Box>
      <Button
        onClick={handleOpen}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          fontSize: "14px",
          color: darkMode ? "white" : "black",
          borderColor: "#888",
          backgroundColor: "transparent",
          borderRadius: "8px",
          textTransform: "none",
          transition: "0.3s",
          marginRight: "10px",
          border: "1px solid #888",
          "&:hover": {
            color: "#888",
            borderColor: "#555",
          },
        }}
      >
        {name}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 150,
            backgroundColor: darkMode ? "#222" : "white",
            color: darkMode ? "white" : "#222",
          },
        }}
      >
        <MenuItem sx={{ fontSize: "14px" }} onClick={handleSignOut}>
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
};
