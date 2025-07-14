import { useState, useEffect } from "react";
import Header from "./Header";
import { useLocation } from "react-router-dom";
import backgroundImage from "../assets/imgs/background.jpg";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { SignIn, UserMenu } from "../utils/helperFunctions";
import { useAuth } from "./AuthContext";

export default function Layout({ children }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, loggedIn } = useAuth();

  const isHome = location.pathname === "/";

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
      key={isHome ? "home" : "other"}
      className="App"
      style={{
        backgroundImage: isHome ? backgroundImage : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "baseline" : "center",
        }}
      >
        <div style={{ flex: 1 }} />
        <Header />
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
      {children}
    </div>
  );
}
