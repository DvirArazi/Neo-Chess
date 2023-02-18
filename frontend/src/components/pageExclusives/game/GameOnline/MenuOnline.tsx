import { Divider, List } from "@mui/material";
import AlertSnackbar from "frontend/src/components/AlertSnackbar";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
import Stateful from "frontend/src/utils/tools/stateful";
import { GameStatus, GameStatusCatagory } from "shared/types/game";
import { isMobile } from "react-device-detect";
import { preloadIcon } from "frontend/src/components/Icon";

export function MenuOnline(props: {
  isOpen: Stateful<boolean>,
  status: GameStatus,
  isTakebackEnabled: boolean,
  onTakebackClick: () => void,
  onDrawClick: () => void,
  onResignClick: () => void,
  onRematchClick: () => void,
  onNewOpponentClick: () => void,
}) {
  const {
    isOpen,
    status,
    isTakebackEnabled,
    onTakebackClick,
    onDrawClick,
    onResignClick,
    onRematchClick,
    onNewOpponentClick,
  } = props;

  const isSnackbarOpen = new Stateful(false);

  preloadIcon("takeback");
  preloadIcon("draw");
  preloadIcon("resign");
  preloadIcon("rematch");
  preloadIcon("person");
  preloadIcon("share");

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
        isEnabled={isTakebackEnabled}
        text='Propose a takeback'
        iconName='takeback'
        action={onTakebackClick}
      />
      <Divider />
      <MenuOption
        text='Offer a draw'
        iconName='draw'
        action={onDrawClick}
      />
      <Divider />
      <MenuOption
        text='Resign'
        iconName='resign'
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
          iconName='rematch'
          action={onRematchClick}
        />
        <Divider />
        <MenuOption
          text='New opponent'
          iconName='person'
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
      iconName='share'
      action={async () => {
        if (isMobile) {
          await navigator.share({
            title: "Neo-Chess",
            url: window.location.href
          })
        } else {
          navigator.clipboard.writeText(
            window.location.href
          );
          isSnackbarOpen.set(true);
        }
      }
      }
    />
  }
}
