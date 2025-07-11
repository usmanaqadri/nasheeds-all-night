import { Card, Typography } from "@mui/material";

function NasheedBoard({ nasheeds, onClick }) {
  const nasheedDivs = nasheeds.map((nasheed, index) => (
    <Card
      variant="outlined"
      onClick={onClick(index)}
      sx={{
        backgroundColor: "rgba(255, 251, 246, 0.8)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        padding: "0px 30px",
        borderRadius: "16px",
        cursor: "pointer",
        transition:
          "background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
        margin: "10px",
        flex: "0 0 220px",

        "&:hover": {
          backgroundColor: "#FAD6A5",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.2)",
          transform: "scale(1.02)",
        },
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Noto Nastaliq Urdu', serif",
          fontSize: "2rem",
          direction: "rtl",
          color: "#151d6e",
          padding: "20px 0",
        }}
      >
        {nasheed.arabTitle}
      </Typography>
      <Typography variant="h6">{nasheed.engTitle}</Typography>
    </Card>
  ));

  return (
    <div>
      <div className="nasheedBoard">{nasheedDivs}</div>
    </div>
  );
}

export default NasheedBoard;
