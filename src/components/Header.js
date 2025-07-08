import React from "react";
import { Link } from "react-router-dom";
function Header() {
  return (
    <div style={{ flex: 1 }}>
      <h1 className="title">
        <Link style={{ textDecoration: "none", color: "inherit" }} to={`/`}>
          Dhikrpedia
        </Link>
      </h1>
    </div>
  );
}

export default Header;
