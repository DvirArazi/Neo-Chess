import { Box, IconButton } from "@mui/material";
import Icon from "frontend/src/components/Icon";

export default function BottomBanner(props: {
  onMenuClick: () => void
}) {
  const { onMenuClick } = props;

  return <Box sx={{
    display: `flex`,
    flexDirection: `row`,
    justifyContent: `space-around`,
  }}>
    <IconButton onClick={onMenuClick}><Icon path="menu" side={40} /></IconButton>
    <IconButton><Icon path="navigate_left" side={40} /></IconButton>
    <IconButton><Icon path="navigate_right" side={40} /></IconButton>
  </Box>;
}