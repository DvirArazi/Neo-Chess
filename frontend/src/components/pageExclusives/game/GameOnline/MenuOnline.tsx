import { Box, Divider, List } from "@mui/material";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
import Stateful from "frontend/src/utils/tools/stateful";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function MenuOnline(props: {
  isOpen: Stateful<boolean>,
  status: GameStatus,
}) {
  const { isOpen, status } = props;

  return <ModalFrame isOpen={isOpen}>{
    status.catagory === GameStatusCatagory.Ongoing ? 
    <>
      <List sx={{ padding: 0 }}>
        <MenuOption
          text='Propose a takeback'
          iconPath='takeback'
          action={()=>{}}
        />
        <Divider />
        <MenuOption
          text='Offer a draw'
          iconPath='draw'
          action={()=>{}}
        />
        <Divider />
        <MenuOption
          text='Resign'
          iconPath='resign'
          action={()=>{}}
        />
      </List>
    </> :
    <>
      <MenuTitle status={status} />
      <List sx={{ padding: 0 }}>
        <MenuOption
          text='Offer a rematch'
          iconPath='rematch'
          action={()=>{}}
        />
        <Divider />
        <MenuOption
          text='New opponent'
          iconPath='person'
          action={()=>{}}
        />
        <Divider />
        <MenuOption
          text='Share'
          iconPath='share'
          action={()=>{}}
        />
      </List>
    </>

  }</ModalFrame>
}

