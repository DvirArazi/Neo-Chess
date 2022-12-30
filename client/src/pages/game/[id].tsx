import { Box } from "@mui/material";
import Layout from "client/src/components/Layout";
import Board, { BoardLayout, SIDE } from "client/src/components/pageExclusives/game/Board";
import Background from "client/src/components/pageExclusives/game/Board/Background";
import { PieceColor, PieceType } from "shared/pieceData";
// import { PieceColor, PieceType } from "client/src/components/pageExclusives/game/pieceData";

export default function Game() {
  let layout: BoardLayout = Array.from({ length: SIDE * SIDE }, () => null);

  layout[8] = { type: PieceType.Bishop, color: PieceColor.Black };
  layout[16] = { type: PieceType.Bishop, color: PieceColor.White };
  layout[9] = { type: PieceType.King, color: PieceColor.Black };
  layout[17] = { type: PieceType.King, color: PieceColor.White };
  layout[10] = { type: PieceType.Knight, color: PieceColor.Black };
  layout[18] = { type: PieceType.Knight, color: PieceColor.White };
  layout[11] = { type: PieceType.Pawn, color: PieceColor.Black };
  layout[19] = { type: PieceType.Pawn, color: PieceColor.White };
  layout[12] = { type: PieceType.Queen, color: PieceColor.Black };
  layout[20] = { type: PieceType.Queen, color: PieceColor.White };
  layout[13] = { type: PieceType.Rook, color: PieceColor.Black };
  layout[21] = { type: PieceType.Rook, color: PieceColor.White };

  return (
    <Layout>
      <Box sx={{ background: `blue` }}>
        <Board layout={layout} />
      </Box>
    </Layout>
  );
}