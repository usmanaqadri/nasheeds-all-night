import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

function Searchbar({ onSearch }) {
  return (
    <TextField
      fullWidth
      placeholder="Search for a nasheed"
      variant="outlined"
      onChange={(e) => onSearch(e.target.value)}
      sx={{
        maxWidth: "220px",
        fontSize: "12px",
        backgroundColor: "white",
        borderRadius: 2,
        input: { color: "#333" },
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontSize: "12px",
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="large" sx={{ color: "#888" }} />
          </InputAdornment>
        ),
      }}
    />
  );
}

export default Searchbar;
