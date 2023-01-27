import { Box, Divider, List, ListItemButton, ListItemText, Switch } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
export function MenuOffline(props) {
    var isOpen = props.isOpen, status = props.status, isFlipped = props.isFlipped, onStartANewGame = props.onStartANewGame;
    return <ModalFrame isOpen={isOpen}>
    <MenuTitle status={status}/>
    <List sx={{ padding: 0 }}>
      <MenuOption text='Start a new game' iconPath='plus' action={onStartANewGame}/>
      <Divider />
      <ListItemButton onClick={function () { isFlipped.set(!isFlipped.value); }}>
        <ListItemText>
          <Box sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "30px",
        }}>
            <Icon name="flip" side={25}/>
            <Box sx={{ padding: "5px" }}></Box>
            <Box>Flip pieces after each turn</Box>
            <Switch checked={isFlipped.value} onChange={function (e) {
            isFlipped.set(e.target.checked);
        }}/>
          </Box>
        </ListItemText>
      </ListItemButton>
    </List>
  </ModalFrame>;
}
