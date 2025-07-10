import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Edit.css";
import Loader from "../components/Loader";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { SnackbarAlert } from "../utils/helperFunctions";
import { baseURL } from "../utils/constants";
import { useAuth } from "../components/AuthContext";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function Edit() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nasheed, setNasheed] = useState("");
  const [nasheedCopy, setNasheedCopy] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const allowEdit = user?.admin || nasheed.creatorId === user?.id;
  useEffect(() => {
    fetch(`${baseURL}/nasheed/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setNasheed(data.foundNasheed);
        setNasheedCopy(data.foundNasheed);
        setIsLoading(false);
      });
  }, [id]);

  const nasheedText = nasheed.arab?.map((arab, index) => {
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

  const nasheedCopyText = nasheedCopy.arab?.map((arab, index) => {
    return (
      <div key={index}>
        <textarea
          className="arab-text"
          name={`arab_${index}`}
          value={arab}
          onChange={handleChange}
        />
        <textarea
          className="non-arab-text"
          name={`rom_${index}`}
          value={nasheedCopy.rom[index]}
          onChange={handleChange}
        />
        <textarea
          className="non-arab-text"
          name={`eng_${index}`}
          value={nasheedCopy.eng[index]}
          onChange={handleChange}
        />
      </div>
    );
  });

  function handleChange(e) {
    let { name, value } = e.target;
    let index;
    let tempValue;
    if (name !== "arabTitle" && name !== "engTitle") {
      [name, index] = name.split("_");
      const copyValue = value;
      tempValue = [...nasheedCopy[name]];
      tempValue[index] = copyValue;
      value = tempValue;
    }
    setNasheedCopy((prevState) => ({ ...prevState, [name]: value }));
  }

  const toggleEdit = () => {
    setEditing((prevState) => !prevState);
  };

  const updateNasheed = async () => {
    handleClose();

    if (!token) {
      setAlert({
        type: "error",
        message: "You must be logged in to create a nasheed.",
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    try {
      const response = await fetch(`${baseURL}/nasheed/${id}`, {
        method: "PUT",
        body: JSON.stringify(nasheedCopy),
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
            message: res.message || "Failed to update nasheed.",
          });
        }
      } else {
        setAlert({
          type: "success",
          message: "Successfully updated nasheed!",
        });
        setNasheed({ ...res });
        setNasheedCopy({ ...res });
        toggleEdit();
        setAlert({ message: "Successfully Updated Nasheed", type: "success" });
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
  return isLoading ? (
    <Loader />
  ) : editing ? (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="modal-confirm" sx={style}>
          <Typography
            className="modal-confirm-text"
            id="modal-modal-title"
            variant="h4"
            component="h2"
          >
            Are you sure you want to make these edits?
          </Typography>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              style={{
                backgroundColor: "#A42A04",
                marginRight: "5px",
              }}
              className="mui-button"
              variant="contained"
              onClick={handleClose}
            >
              No
            </Button>
            <Button
              style={{
                marginRight: "5px",
              }}
              className="mui-button"
              variant="contained"
              onClick={updateNasheed}
            >
              Yes
            </Button>
          </div>
        </Box>
      </Modal>
      <SnackbarAlert
        open={showAlert}
        onClose={() => setShowAlert(false)}
        message={alert.message}
        type={alert.type}
      />
      <div className="wrapper">
        <div style={{ flex: 1 }} />
        <div className="container">
          <div className="edit-title">
            <textarea
              name="arabTitle"
              value={nasheedCopy.arabTitle}
              onChange={handleChange}
            />
            <textarea
              name="engTitle"
              value={nasheedCopy.engTitle}
              onChange={handleChange}
            />
          </div>
          <div style={{ marginTop: "-20px" }} className="body">
            {nasheedCopyText}
          </div>
        </div>
        <div className="edit-buttons">
          <Button
            style={{
              backgroundColor: "#A42A04",
              marginBottom: "5px",
            }}
            className="mui-button"
            variant="contained"
            onClick={toggleEdit}
          >
            Cancel
          </Button>
          <Button
            style={{ backgroundColor: "#2f7c31" }}
            className="mui-button"
            variant="contained"
            onClick={handleOpen}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  ) : (
    <div className="wrapper">
      <div style={{ flex: 1 }} />
      <div className="container">
        <SnackbarAlert
          open={showAlert}
          onClose={() => setShowAlert(false)}
          message={alert.message}
          type={alert.type}
        />{" "}
        <div className="edit-title">
          <p>{nasheed.arabTitle}</p>
          <p>{nasheed.engTitle}</p>
        </div>
        <div className="body">{nasheedText}</div>
      </div>
      <div className="edit-buttons">
        {
          <Button
            className="mui-button"
            variant="contained"
            onClick={toggleEdit}
            style={{ visibility: allowEdit ? "visible" : "hidden" }}
          >
            Edit
          </Button>
        }
      </div>
    </div>
  );
}

export default Edit;
