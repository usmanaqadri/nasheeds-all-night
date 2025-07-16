import Header from "./Header";
import { useLocation } from "react-router-dom";
import backgroundImage from "../assets/imgs/background.jpg";

export default function Layout({ children }) {
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <div
      key={isHome ? "home" : "other"}
      className="App"
      style={{
        backgroundImage: isHome ? backgroundImage : "none",
      }}
    >
      <Header isHome={isHome} />
      {children}
    </div>
  );
}
