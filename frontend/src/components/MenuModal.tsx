import { Box, Divider, List, ListItem, ListItemButton, ListItemText, Modal, SxProps, Theme, Typography } from "@mui/material";
import Stateful from "frontend/src/utils/tools/stateful";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function MenuModal(props: {
  isOpen: Stateful<boolean>,
  status: GameStatus,
}) {
  const { isOpen, status } = props;

  return (
    <Modal
      open={isOpen.value}
      onClose={() => { isOpen.set(false) }}
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `100%`,
        outline: 0,
        display: `flex`,
        justifyContent: `center`,
      }}>
        <Box sx={{
          margin: `30px`,
          width: `300px`,
          bgcolor: 'background.paper',
          borderRadius: '15px',
          boxShadow: 24,
          textAlign: `center`,
        }}>
          {getMenu()}
        </Box>
      </Box>
    </Modal>
  );

  function getMenu() {
    if (status.catagory === GameStatusCatagory.Ongoing) {
      return (
        <List sx={{ padding: 0 }}>
          <ListItemButton sx={listItemStyle}>
            {/* //listItemIcon */}
            <ListItemText>Propose a takeback</ListItemText>
          </ListItemButton>
          <Divider />
          <ListItemButton sx={listItemStyle}>
            {/* //listItemIcon */}
            <ListItemText>Offer a draw</ListItemText>
          </ListItemButton>
          <Divider />
          <ListItemButton sx={listItemStyle}>
            {/* //listItemIcon */}
            <ListItemText>Resign</ListItemText>
          </ListItemButton>
        </List>
      )
    }

    return (<>
      <Box sx={{
        padding: `20px`,
        fontStyle: `italic`,
        fontWeight: `bold`,
        fontFamily: `sans-serif`,
        // color: `gray`,
      }}>{
          statusToMessage(status)
        }</Box>
      <Divider variant="middle" />
      <List sx={{ padding: 0 }}>
        <ListItemButton sx={listItemStyle}>
          {/* //listItemIcon */}
          <ListItemText>Offer a rematch</ListItemText>
        </ListItemButton>
        <Divider />
        <ListItemButton sx={listItemStyle}>
          {/* //listItemIcon */}
          <ListItemText>New Opponent</ListItemText>
        </ListItemButton>
        <Divider />
        <ListItemButton sx={listItemStyle}>
          {/* //listItemIcon */}
          <ListItemText>Share</ListItemText>
        </ListItemButton>
      </List>
    </>)
  }
}

const listItemStyle: SxProps<Theme> = {
  textAlign: `center`
}

function statusToMessage(status: GameStatus) {
  switch (status.catagory) {
    case GameStatusCatagory.Win: {
      const winColor = getColorName(status.winColor);
      const reason = (() => {
        switch (status.reason) {
          case WinReason.Checkmate: return ' by checkmate';
          case WinReason.Stalemate: return ' by stalemate';
          case WinReason.KingCaptured: return ' by capturing the opponent\'s king';
          case WinReason.Resignation: return `, ${getColorName(getOppositeColor(status.winColor))} resigned`;
          case WinReason.Timeout: return ' by timeout';
        }
      })()
      return `${winColor} won${reason}`;
    }
    case GameStatusCatagory.Draw: {
      const reason = (() => {
        switch (status.reason) {
          case DrawReason.Agreement: return 'agreement';
          case DrawReason.InsufficientMaterial: return 'insufficient material';
          case DrawReason.Repetition: return 'repetition';
        }
      })()
      return `Draw by ${reason}`;
    }
    default: {
      throw new Error(`MenuModal opened with an invalid status catagory: ${status.catagory}`);
    }
  }
}

function getColorName(color: PieceColor) {
  switch (color) {
    case PieceColor.White: return 'White';
    case PieceColor.Black: return 'Black';
  }
}