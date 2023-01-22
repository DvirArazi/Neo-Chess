import { Box, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Icon from "frontend/src/components/Icon";

export default function MenuOption(props: {
  text: string,
  iconPath: string,
  action: () => void,
}) {
  const { text, iconPath, action } = props;

  return <ListItemButton
    onClick={action}
  >
    <ListItemText>
      <Box sx={{
        display: `flex`,
        justifyContent: `center`,
      }}>
        <Icon path={iconPath} side={25} />
        <Box sx={{padding:`5px`}}></Box>
        <Box>{text}</Box>
      </Box>
    </ListItemText>
  </ListItemButton>
}