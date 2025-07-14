import { Card, Typography } from "@mui/material";

function NasheedBoard({ nasheeds, onClick }) {
  const nasheedDivs = nasheeds.map((nasheed, index) => (
    <Card
      key={nasheed.engTitle}
      variant="outlined"
      onClick={onClick(index)}
      sx={{
        backgroundColor: "rgba(255, 251, 246, 0.8)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        padding: "20px 40px",
        borderRadius: "16px",
        cursor: "pointer",
        transition:
          "background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
        margin: "10px",
        flex: "0 0 220px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",

        "&:hover": {
          backgroundColor: "#FAD6A5",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.2)",
          transform: "scale(1.02)",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "1.6rem",
          color: "#151d6e",
        }}
      >
        {nasheed.engTitle}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Noto Nastaliq Urdu', serif",
          direction: "rtl",
          fontSize: "1.5rem",
          padding: "5px 0",
          lineHeight: "2.5",
        }}
        variant="h6"
      >
        {nasheed.arabTitle}
      </Typography>
    </Card>
  ));

  return (
    <div>
      <div className="nasheedBoard">{nasheedDivs}</div>
    </div>
  );
}

export default NasheedBoard;
