import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Edit.css";
import Loader from "../components/Loader";

function Edit() {
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nasheed, setNasheed] = useState("");
  const [nasheedCopy, setNasheedCopy] = useState("");
  const { id } = useParams();
  useEffect(() => {
    fetch(
      `${
        process.env.NODE_ENV === "development"
          ? "http://localhost:3001"
          : process.env.REACT_APP_API
      }/nasheed/${id}`
    )
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
        <textarea name={`arab${index}`} value={arab} onChange={handleChange} />
        <textarea
          name={`rom${index}`}
          value={nasheedCopy.rom[index]}
          onChange={handleChange}
        />
        <textarea
          name={`eng${index}`}
          value={nasheedCopy.eng[index]}
          onChange={handleChange}
        />
      </div>
    );
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setNasheedCopy((prevState) => ({ ...prevState, [name]: value }));
  }

  const toggleEdit = () => {
    setEditing((prevState) => !prevState);
  };
  return isLoading ? (
    <Loader />
  ) : editing ? (
    <>
      <button onClick={toggleEdit}>Finish Edit</button>
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
    </>
  ) : (
    <>
      <button onClick={toggleEdit}>Edit</button>
      <div className="container">
        <div className="edit-title">
          <p>{nasheed.arabTitle}</p>
          <p>{nasheed.engTitle}</p>
        </div>
        <div className="body">{nasheedText}</div>
      </div>
    </>
  );
}

export default Edit;
