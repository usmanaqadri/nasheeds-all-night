import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

function Searchbar({ onSearch }) {
  return (
    <TextField
      placeholder="Search for a nasheed"
      variant="outlined"
      onChange={(e) => onSearch(e.target.value)}
      sx={{
        fontSize: "13px",
        backgroundColor: "white",
        borderRadius: 2,
        input: { color: "#333" },
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontSize: "13px",
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
