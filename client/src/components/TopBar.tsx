import { Box, SxProps } from "@mui/material";
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

  return (
    <Box sx={barSx}>
      <Box sx={rowSx}>
        <Box sx={itemSx}>
        </Box>
        <Box sx={itemSx}>Sign In</Box>
      </Box>
      <Box sx={rowSx}>
        <Box sx={{
          ...itemSx,
          ...{
            width: `25px`,
            height: `25px`,
          }
        }}>
          <Icon path="fight" />
        </Box>
        <Box sx={{
          ...itemSx,
          ...{
            width: `23px`,
            height: `23px`,
          }
        }}>
          <Icon path="history" />
        </Box>
        <Box sx={{
          ...itemSx,
          ...{
            width: `30px`,
            height: `30px`,
          }
        }}>
          <Icon path="friends" />
        </Box>
      </Box>
    </Box>
  );
}