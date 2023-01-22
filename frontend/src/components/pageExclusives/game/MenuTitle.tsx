import { Box, Divider } from "@mui/material";
import { getColorName } from "frontend/src/utils/tools/general";
import { getOppositeColor } from "shared/tools/piece";
import { DrawReason, GameStatus, GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function MenuTitle(props: { status: GameStatus }) {
  const { status } = props;

  return status.catagory === GameStatusCatagory.Ongoing ?
  <></> :
  <>
    <Box sx={{
      padding: `20px`,
      fontStyle: `italic`,
      fontWeight: `bold`,
      fontFamily: `sans-serif`,
    }}>
      {gameStatusToMessage(status)}
    </Box>
    <Divider variant="middle" />
  </>
  ;
}

function gameStatusToMessage(status: GameStatus) {
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
      throw new Error(`MenuTitle opened with an invalid status catagory: ${status.catagory}`);
    }
  }
}