import { Box, Divider } from "@mui/material";
import { gameStatusToMessage, getColorName } from "frontend/src/utils/tools/general";
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