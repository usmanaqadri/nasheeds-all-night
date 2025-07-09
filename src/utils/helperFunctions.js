import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Snackbar,
  Alert as MuiAlert,
  Button,
  Menu,
  MenuItem,
  Box,
  Avatar,
  IconButton,
  Typography,
  Divider,
} from "@mui/material";
import { baseURL } from "./constants";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

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

export const handleGoogleLogin = async (
  tokenResponse,
  setLoggedIn,
  setUser
) => {
  const googleToken = tokenResponse.code;

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

    setUser(jwtDecode(data.token));
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

export const UserMenu = ({ name, picture, onSignOut, darkMode }) => {
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
    <Box sx={{ marginRight: "10px" }}>
      <IconButton onClick={handleOpen} size="small">
        <Avatar src={picture} alt={name} sx={{ width: 30, height: 30 }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 220,
            backgroundColor: darkMode ? "#222" : "white",
            color: darkMode ? "white" : "#222",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Box px={2}>
          <Typography fontSize="14px" color={"gray"} noWrap>
            {name}
          </Typography>
        </Box>
        <Divider sx={{ my: 1, borderColor: "#444" }} />
        {/* <MenuItem
          sx={{
            fontSize: "14px",
            "&:hover": {
              backgroundColor: darkMode ? "#333" : "#f5f5f5",
            },
          }}
        >
          {darkMode ? "Light" : "Dark"} Mode
        </MenuItem> */}
        <MenuItem
          onClick={handleSignOut}
          sx={{
            fontSize: "14px",
            "&:hover": {
              backgroundColor: darkMode ? "#333" : "#f5f5f5",
            },
          }}
        >
          Sign out
        </MenuItem>
      </Menu>
    </Box>
  );
};

export const SignIn = ({ setLoggedIn, setUser }) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      await handleGoogleLogin(tokenResponse, setLoggedIn, setUser);
    },
    flow: "auth-code",
    onError: (err) => console.log("Login Failed:", err),
  });

  return (
    <Button
      onClick={login}
      variant="outlined"
      sx={{
        fontSize: "14px",
        color: "white",
        borderColor: "#888",
        backgroundColor: "transparent",
        borderRadius: "8px",
        textTransform: "none",
        transition: "0.3s",
        marginRight: "10px",
        "&:hover": {
          color: "#888",
          borderColor: "#555",
        },
      }}
    >
      Sign in
    </Button>
  );
};
