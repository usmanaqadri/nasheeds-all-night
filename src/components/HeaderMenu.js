import { useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import {
  CastConnectedOutlined,
  ExpandMore,
  HomeOutlined,
  LibraryAddOutlined,
  LoginOutlined,
  LogoutOutlined,
  Menu as MenuIcon,
  MeetingRoomOutlined,
  SlideshowOutlined,
} from "@mui/icons-material";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { handleGoogleLogin } from "../utils/helperFunctions";

const createActions = [
  { path: "/create/nasheed", label: "New Nasheed", Icon: LibraryAddOutlined },
  { path: "/create/slideshow", label: "New Slideshow", Icon: SlideshowOutlined },
  { path: "/create/session", label: "Host a session", Icon: CastConnectedOutlined },
];

export default function HeaderMenu({ isHome }) {
  const { loggedIn, user, signOut, setLoggedIn, setUser } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const codeInput = useRef(null);
  const open = Boolean(anchorEl);
  const accountName = user?.name || user?.email || "Account";

  const login = useGoogleLogin({
    onSuccess: ({ code }) => handleGoogleLogin(code, setLoggedIn, setUser),
    flow: "auth-code",
    onError: (err) => console.log("Login Failed:", err),
  });

  const closeMenu = () => {
    setAnchorEl(null);
    setJoinOpen(false);
    setSessionCode("");
  };

  const navigateFromMenu = (path) => {
    closeMenu();
    navigate(path);
  };

  const handleJoinFormKeyDown = (event) => {
    if (event.key === "Escape") return;

    if (event.key === "Tab") {
      const fromInput = event.target === codeInput.current;
      const staysInForm = fromInput
        ? !event.shiftKey && Boolean(sessionCode.trim())
        : event.shiftKey;
      if (!staysInForm) return;
    }

    // Keep typing and movement within the form out of the menu's key handler.
    event.stopPropagation();
  };

  const handleJoin = (event) => {
    event.preventDefault();
    const code = sessionCode.trim();
    if (code) {
      closeMenu();
      navigate(`/session/${encodeURIComponent(code)}`);
    }
  };

  return (
    <>
      <IconButton
        id="main-menu-button"
        aria-label="Main menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "main-menu" : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ mr: "10px", width: 48, height: 48, color: isHome ? "white" : "#222" }}
      >
        <MenuIcon fontSize="large" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ id: "main-menu", "aria-labelledby": "main-menu-button" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 272,
            borderRadius: 2,
            backgroundColor: isHome ? "#222" : "white",
            color: isHome ? "white" : "#222",
            "& .MuiMenuItem-root": {
              minHeight: 48,
              "&:hover": { backgroundColor: isHome ? "#333" : "#f5f5f5" },
            },
            "& .MuiListItemIcon-root": {
              color: "inherit",
              "& .MuiSvgIcon-root": { fontSize: "2rem" },
            },
            "& .MuiListItemText-primary": {
              fontSize: "1.6rem",
              fontWeight: 500,
            },
          },
        }}
      >
        {loggedIn && (
          <ListSubheader
            disableSticky
            role="presentation"
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "inherit",
              backgroundColor: "inherit",
            }}
          >
            <Avatar src={user?.picture} alt={accountName}>
              {accountName.charAt(0)}
            </Avatar>
            <Typography sx={{ fontSize: "1.8rem", fontWeight: 600, overflowWrap: "anywhere" }}>
              {accountName}
            </Typography>
          </ListSubheader>
        )}
        {loggedIn && <Divider />}
        {!isHome && (
          <MenuItem onClick={() => navigateFromMenu("/")}>
            <ListItemIcon><HomeOutlined /></ListItemIcon>
            <ListItemText primary="Home" />
          </MenuItem>
        )}
        {loggedIn && createActions.map(({ path, label, Icon }) => (
          <MenuItem key={path} onClick={() => navigateFromMenu(path)}>
            <ListItemIcon><Icon /></ListItemIcon>
            <ListItemText primary={label} />
          </MenuItem>
        ))}
        <MenuItem
          aria-expanded={joinOpen}
          aria-controls={joinOpen ? "join-session-form" : undefined}
          onClick={() => setJoinOpen(!joinOpen)}
        >
          <ListItemIcon><MeetingRoomOutlined /></ListItemIcon>
          <ListItemText primary="Join live session" />
          <ExpandMore
            sx={{
              fontSize: "2rem",
              transform: joinOpen ? "rotate(180deg)" : "none",
              transition: "transform 180ms ease",
            }}
          />
        </MenuItem>
        <Collapse
          component="li"
          role="presentation"
          in={joinOpen}
          timeout={180}
          unmountOnExit
          onEntered={() => codeInput.current?.focus()}
        >
          <Box
            id="join-session-form"
            component="form"
            onSubmit={handleJoin}
            onKeyDown={handleJoinFormKeyDown}
            sx={{ display: "flex", gap: 1, px: 2, pt: 0.5, pb: 1.5 }}
          >
            <TextField
              inputRef={codeInput}
              fullWidth
              size="small"
              autoComplete="off"
              label="Session code"
              value={sessionCode}
              onChange={(event) => setSessionCode(event.target.value)}
              sx={{
                minWidth: 0,
                "& .MuiInputBase-root, & .MuiInputLabel-root": {
                  fontSize: "1.4rem",
                  color: "inherit",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isHome ? "#888" : undefined,
                },
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: isHome ? "#bbb" : undefined,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!sessionCode.trim()}
              sx={{
                fontSize: "1.4rem",
                textTransform: "none",
                "&.Mui-disabled": isHome ? { color: "#aaa", bgcolor: "#383838" } : {},
              }}
            >
              Join
            </Button>
          </Box>
        </Collapse>
        <Divider />
        {loggedIn ? (
          <MenuItem onClick={() => {
            closeMenu();
            signOut();
          }}>
            <ListItemIcon><LogoutOutlined /></ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        ) : (
          <MenuItem onClick={() => {
            login();
            closeMenu();
          }}>
            <ListItemIcon><LoginOutlined /></ListItemIcon>
            <ListItemText primary="Sign in" />
          </MenuItem>
        )}
      </Menu>

    </>
  );
}
