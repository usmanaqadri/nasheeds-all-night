import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Edit.css";
import Header from "../components/Header";
import Loader from "../components/Loader";

function Edit() {
  const [isLoading, setIsLoading] = useState(true);
  const [nasheed, setNasheed] = useState("");
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
  return (
    <>
      <Header />
      {isLoading ? (
        <Loader />
      ) : (
        <div className="container">
          <div className="title">
            {nasheed.arabTitle}
            <br />
            {nasheed.engTitle}
          </div>
          <div className="body">{nasheedText}</div>
        </div>
      )}
    </>
  );
}

export default Edit;
