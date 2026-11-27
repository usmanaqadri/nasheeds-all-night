import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeaderMenu from "./HeaderMenu";
import { GoogleOAuthProvider } from "@react-oauth/google";

function Header({ isHome }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "baseline" : "center",
      }}
    >
      <div style={{ flex: 1 }} />
      <div style={{ flex: 1 }}>
        <h1 className="title">
          <Link
            style={{
              textDecoration: "none",
              color: isHome ? "white" : "inherit",
            }}
            to={`/`}
          >
            dhikrpedia
          </Link>
        </h1>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <HeaderMenu isHome={isHome} />
        </GoogleOAuthProvider>
      </div>
    </div>
  );
}

export default Header;
