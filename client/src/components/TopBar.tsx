import { Box, createTheme, SxProps } from "@mui/material";
import Icon from "./Icon";

export default function TopBar() {
  const barSx: SxProps = {
    display: `flex`,
    justifyContent: `space-between`,
  };
  const rowSx: SxProps = {
    display: `flex`,
    flexDirection: `row`,
  }
  const itemSx: SxProps = {
    padding: `5px`,
  }

  const iconSx: SxProps = {
    width: `25px`,
    height: `25px`,
  }

  return (
    <Box sx={barSx}>
      <Box sx={rowSx}>
        <Box sx={itemSx}>Log In</Box>
        <Box sx={itemSx}>Sign In</Box>
      </Box>
      <Box sx={rowSx}>
        <Box sx={{...itemSx, ...iconSx}}>
          <Icon path="fight" />
        </Box>
        <Box sx={{...itemSx, ...iconSx}}>
          <Icon path="history" />
        </Box>
        <Box sx={{...itemSx, ...iconSx}}>
          <Icon path="user" />
        </Box>
      </Box>
    </Box>
  );
}