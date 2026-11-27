import { jwtDecode } from "jwt-decode";
import { Alert, Snackbar } from "@mui/material";
import { baseURL } from "./constants";

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
      <div key={index} className="translation-container">
        <p>{arab}</p>
        <p>
          <em dangerouslySetInnerHTML={{ __html: nasheed.rom[index] }} />
        </p>
        <p
          dangerouslySetInnerHTML={{
            __html: nasheed.eng[index],
          }}
        />
      </div>
    );
  });

export const sortFootnotes = (a, b) => {
  if (a.verseIndex !== b.verseIndex) {
    return a.verseIndex - b.verseIndex;
  }
  return a.range[0] - b.range[0];
};

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
