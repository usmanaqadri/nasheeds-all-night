import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { SignIn, UserMenu } from "../utils/helperFunctions";
import { GoogleOAuthProvider } from "@react-oauth/google";

function Header({ isHome }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, loggedIn } = useAuth();

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
          <Link style={{ textDecoration: "none", color: "inherit" }} to={`/`}>
            Dhikrpedia
          </Link>
        </h1>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        {loggedIn ? (
          <UserMenu
            name={user?.name}
            picture={user?.picture}
            email={user?.email}
            darkMode={isHome}
            isMobile={isMobile}
          />
        ) : (
          <GoogleOAuthProvider
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
          >
            <SignIn darkMode={isHome} />
          </GoogleOAuthProvider>
        )}
      </div>
    </div>
  );
}

export default Header;
