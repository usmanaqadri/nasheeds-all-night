import React from "react";

function NasheedBoard({ nasheeds, onClick }) {
  const myNasheeds = [];

  nasheeds.forEach((element) => {
    const modifiedTitle =
      element.engTitle.length < 15
        ? element.engTitle
        : element.engTitle.substring(0, 15);
    myNasheeds.push(modifiedTitle);
  });

  const nasheedDivs = myNasheeds.map((nasheed, index) => (
    <div className="nasheed-buttons" key={index}>
      <button onClick={onClick(index)} className="button-64">
        <span className="text">{nasheed}</span>
      </button>
    </div>
  ));

  return (
    <div>
      <div className="nasheedBoard">{nasheedDivs}</div>
    </div>
  );
}

export default NasheedBoard;
