import { Box, Divider, List, ListItemButton, ListItemText, Switch } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
import Stateful from "frontend/src/utils/tools/stateful";
import { GameStatus } from "shared/types/game";

export function MenuOffline(props: {
  isOpen: Stateful<boolean>,
  status: GameStatus,
  isFlipped: Stateful<boolean>,
  onStartANewGame: () => void,
}) {
  const { isOpen, status, isFlipped, onStartANewGame } = props;

  return <ModalFrame isOpen={isOpen}>
    <MenuTitle status={status} />
    <List sx={{ padding: 0 }}>
      <MenuOption
        text='Start a new game'
        iconPath='plus'
        action={onStartANewGame}
      />
      <Divider />
      <ListItemButton
        onClick={() => { isFlipped.set(!isFlipped.value) }}
      >
        <ListItemText>
          <Box sx={{
            display: `flex`,
            justifyContent: `center`,
            alignItems: `center`,
            height: `30px`,
          }}>
            <Icon name="flip" side={25} />
            <Box sx={{ padding: `5px` }}></Box>
            <Box>Flip pieces after each turn</Box>
            <Switch
              checked={isFlipped.value}
              onChange={(e) => {
                isFlipped.set(e.target.checked)
              }}
            />
          </Box>
        </ListItemText>
      </ListItemButton>
    </List>
  </ModalFrame>;
}