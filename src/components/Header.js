import React from "react";
import { Link } from "react-router-dom";
function Header() {
  return (
    <div>
      <h1 className="title">
        <Link style={{ textDecoration: "none", color: "inherit" }} to={`/`}>
          Nasheeds All Night
        </Link>
      </h1>
    </div>
  );
}

export default Header;
