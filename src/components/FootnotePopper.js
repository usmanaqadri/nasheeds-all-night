import {
  ClickAwayListener,
  Popper,
  Paper,
  Tooltip,
  IconButton,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

export const FootnotePopper = ({
  footnotes,
  openFootnote,
  anchorEl,
  setOpenFootnote,
  setAnchorEl,
}) => {
  return (
    <Popper
      open={openFootnote !== null}
      anchorEl={anchorEl}
      placement="top-start"
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener
        onClickAway={() => {
          setOpenFootnote(null);
          setAnchorEl(null);
        }}
      >
        <Paper sx={{ maxWidth: 300, position: "relative" }}>
          <Tooltip
            title="Close"
            placement="top"
            componentsProps={{
              tooltip: {
                sx: {
                  fontSize: "12px",
                  padding: "5px 10px",
                },
              },
            }}
          >
            <IconButton
              size="small"
              onClick={() => {
                setOpenFootnote(null);
                setAnchorEl(null);
              }}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                zIndex: 1,
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>

          <Typography sx={{ fontSize: "1.2rem", padding: 2, pt: 4 }}>
            {openFootnote !== null ? footnotes[openFootnote]?.content : ""}
          </Typography>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
};
