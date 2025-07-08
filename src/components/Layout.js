import { useEffect, useState } from "react";
import Header from "./Header";
import { useLocation } from "react-router-dom";
import backgroundImage from "../assets/imgs/background.jpg";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { handleGoogleLogin, UserMenu } from "../utils/helperFunctions";
import { jwtDecode } from "jwt-decode";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoggedIn(false);
    } else {
      setUser(jwtDecode(token));
      setLoggedIn(true);
    }
  }, []);

  const isHome = location.pathname === "/";

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
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }} />
        <Header />
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {loggedIn ? (
            <UserMenu
              name={user.firstName}
              onSignOut={() => {
                localStorage.removeItem("token");
                setLoggedIn(false);
              }}
              darkMode={isHome}
            />
          ) : (
            <GoogleOAuthProvider
              clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            >
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  handleGoogleLogin(credentialResponse, setLoggedIn);
                }}
                onError={() => {
                  console.log("Login Failed");
                }}
              />
            </GoogleOAuthProvider>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
