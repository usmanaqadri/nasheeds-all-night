import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Snackbar,
  Alert,
  Button,
  Menu,
  MenuItem,
  Box,
  Avatar,
  IconButton,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";
import { baseURL } from "./constants";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { AddCircleOutlineOutlined } from "@mui/icons-material";

export const alphabetize = (a, b) =>
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

export const removeDiacritics = (str) => {
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

export const handleGoogleLogin = async (code, setLoggedIn, setUser) => {
  try {
    const res = await fetch(`${baseURL}/user/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
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
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <Alert
        onClose={onClose}
        severity={type || "error"}
        variant="filled"
        sx={{ fontSize: "1.3rem" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export const UserMenu = ({ name, picture, darkMode, isMobile }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
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
    signOut();
  };

  return (
    <Box sx={{ marginRight: "10px" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: isMobile ? "column-reverse" : "row",
          gap: 1,
        }}
      >
        {darkMode && user && (
          <Tooltip
            componentsProps={{
              tooltip: {
                sx: {
                  fontSize: "12px",
                  padding: "5px 10px",
                },
              },
            }}
            title="Create Nasheed"
          >
            <IconButton onClick={() => navigate("/create")}>
              <AddCircleOutlineOutlined
                sx={{ fontSize: "30px", color: "white" }}
              />
            </IconButton>
          </Tooltip>
        )}
        <IconButton onClick={handleOpen} size="small">
          <Avatar src={picture} alt={name} sx={{ width: 30, height: 30 }} />
        </IconButton>
      </Box>

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

export const SignIn = ({ darkMode }) => {
  const { setLoggedIn, setUser } = useAuth();
  const login = useGoogleLogin({
    onSuccess: async ({ code }) => {
      await handleGoogleLogin(code, setLoggedIn, setUser);
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
        color: darkMode ? "white" : "#222",
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
