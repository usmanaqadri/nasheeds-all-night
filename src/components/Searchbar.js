import React from "react";

function Searchbar({ onSearch }) {
  return (
    <input
      name="search"
      placeholder="search for a nasheed"
      type={"text"}
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}

export default Searchbar;
