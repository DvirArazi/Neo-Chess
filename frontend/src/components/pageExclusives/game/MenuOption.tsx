import { Box, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { IconName } from "frontend/src/utils/types/iconName";

export default function MenuOption(props: {
  text: string,
  iconName: IconName,
  isEnabled?: boolean
  action: () => void,
}) {
  const { text, iconName, action } = props;
  const isEnabled = props.isEnabled ?? true;

  return <ListItemButton
    disabled={!isEnabled}
    onClick={action}
  >
    <ListItemText>
      <Box sx={{
        display: `flex`,
        justifyContent: `center`,
      }}>
        <Icon name={iconName} side={25} />
        <Box sx={{ padding: `5px` }}></Box>
        <Box>{text}</Box>
      </Box>
    </ListItemText>
  </ListItemButton>
}