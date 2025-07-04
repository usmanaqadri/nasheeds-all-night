import { Snackbar, Alert as MuiAlert } from "@mui/material";

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
