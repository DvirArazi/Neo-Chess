import { Box, Divider, List } from "@mui/material";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
import Stateful from "frontend/src/utils/tools/stateful";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export function MenuOnline(props: {
  isOpen: Stateful<boolean>,
  status: GameStatus,
  onTakebackClick: () => void,
  onDrawClick: () => void,
  onResignClick: () => void,
  onRematchClick: () => void,
  onNewOpponentClick: () => void,
  onShareClick: () => void,
}) {
  const {
    isOpen,
    status,
    onTakebackClick,
    onDrawClick,
    onResignClick,
    onRematchClick,
    onNewOpponentClick,
    onShareClick,
  } = props;

  return <ModalFrame isOpen={isOpen} keepMounted={false}>{
    status.catagory === GameStatusCatagory.Ongoing ?
      getOngoingMenu() : getEndMenu()
  }</ModalFrame>;

  function getOngoingMenu() {
    return <List sx={{ padding: 0 }}>
      <MenuOption
        text='Propose a takeback'
        iconPath='takeback'
        action={onTakebackClick}
      />
      <Divider />
      <MenuOption
        text='Offer a draw'
        iconPath='draw'
        action={onDrawClick}
      />
      <Divider />
      <MenuOption
        text='Resign'
        iconPath='resign'
        action={onResignClick}
      />
    </List>
  }

  function getEndMenu() {
    return <>
      <MenuTitle status={status} />
      <List sx={{ padding: 0 }}>
        <MenuOption
          text='Offer a rematch'
          iconPath='rematch'
          action={onRematchClick}
        />
        <Divider />
        <MenuOption
          text='New opponent'
          iconPath='person'
          action={onNewOpponentClick}
        />
        <Divider />
        <MenuOption
          text='Share'
          iconPath='share'
          action={onShareClick}
        />
      </List>
    </>
  }
}
