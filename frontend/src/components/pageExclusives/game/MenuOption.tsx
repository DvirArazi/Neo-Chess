import { Box, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { IconName } from "frontend/src/utils/types/iconName";

export default function MenuOption(props: {
  text: string,
  iconPath: IconName,
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
        <Icon name={iconPath} side={25} />
        <Box sx={{ padding: `5px` }}></Box>
        <Box>{text}</Box>
      </Box>
    </ListItemText>
  </ListItemButton>
}