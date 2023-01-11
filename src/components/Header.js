import React from "react";
import { Link } from "react-router-dom";
function Header() {
  return (
    <div>
      <Link style={{ textDecoration: "none", color: "inherit" }} to={`/`}>
        <h1 className="title">Nasheeds All Night</h1>
      </Link>
    </div>
  );
}

export default Header;
