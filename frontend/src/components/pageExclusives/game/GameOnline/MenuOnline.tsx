import { Box, Divider, List } from "@mui/material";
import AlertSnackbar from "frontend/src/components/AlertSnackbar";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
import Stateful from "frontend/src/utils/tools/stateful";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, WinReason } from "shared/types/game";
import { isMobile } from "react-device-detect";

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

  const isSnackbarOpen = new Stateful(false);

  return <ModalFrame isOpen={isOpen} keepMounted={false}>
    {
      status.catagory === GameStatusCatagory.Ongoing ?
        getOngoingMenu() : getEndMenu()
    }
    <AlertSnackbar
      isOpen={isSnackbarOpen}
      severity={"info"}
      message={'Game link was copied to clipboard'}
    />
  </ModalFrame>;

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
      <Divider />
      {getShareOption()}
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
        {getShareOption()}
      </List>
    </>
  }

  function getShareOption() {
    return <MenuOption
      text='Share'
      iconPath='share'
      action={async () =>
        isMobile ?
          await navigator.share({
            title: "Neo-Chess",
            url: window.location.href
          }) :
          navigator.clipboard.writeText(
            window.location.href
          )
      }
    />
  }
}
