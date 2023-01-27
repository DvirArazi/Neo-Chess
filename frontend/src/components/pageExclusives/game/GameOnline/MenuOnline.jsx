import { Divider, List } from "@mui/material";
import ModalFrame from "frontend/src/components/ModalFrame";
import MenuOption from "frontend/src/components/pageExclusives/game/MenuOption";
import MenuTitle from "frontend/src/components/pageExclusives/game/MenuTitle";
import { GameStatusCatagory } from "shared/types/game";
export default function MenuOnline(props) {
    var isOpen = props.isOpen, status = props.status;
    return <ModalFrame isOpen={isOpen}>{status.catagory === GameStatusCatagory.Ongoing ?
            <>
      <List sx={{ padding: 0 }}>
        <MenuOption text='Propose a takeback' iconPath='takeback' action={function () { }}/>
        <Divider />
        <MenuOption text='Offer a draw' iconPath='draw' action={function () { }}/>
        <Divider />
        <MenuOption text='Resign' iconPath='resign' action={function () { }}/>
      </List>
    </> :
            <>
      <MenuTitle status={status}/>
      <List sx={{ padding: 0 }}>
        <MenuOption text='Offer a rematch' iconPath='rematch' action={function () { }}/>
        <Divider />
        <MenuOption text='New opponent' iconPath='person' action={function () { }}/>
        <Divider />
        <MenuOption text='Share' iconPath='share' action={function () { }}/>
      </List>
    </>}</ModalFrame>;
}
