import Content from "frontend/src/components/pageExclusives/index/Content";
import Board from "frontend/src/components/pageExclusives/game/Board";
import { isInCheckmate, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";
import GameOffline from "frontend/src/components/pageExclusives/game/GameOffline";
import { Box } from "@mui/material";


export default function Home() {
  // const bla = isInCheckmate(
  //   [
  //     {type: PieceType.King, color: PieceColor.White, key: 0},
  //     ...(new Array(8).fill(undefined)),
  //     {type: PieceType.Rook, color: PieceColor.White, key: 0},
  //     ...(new Array(45).fill(undefined)),
  //     {type: PieceType.Pawn, color: PieceColor.Black, key: 1},
  //     ...(new Array(6).fill(undefined)),
  //     {type: PieceType.Bishop, color: PieceColor.Black, key: 2},
  //     {type: PieceType.King, color: PieceColor.Black, key: 3},
  //   ],
  //   PieceColor.Black
  // );

  return (
    <>
      {/* <Content /> */}
      {/* <Board
        layout={[
          {type: PieceType.King, color: PieceColor.White, key: 0},
          undefined,
          {type: PieceType.Bishop, color: PieceColor.White, key: 1},
          ...(new Array(52).fill(undefined)),
          {type: PieceType.Pawn, color: PieceColor.Black, key: 0},
          ...(new Array(6).fill(undefined)),
          {type: PieceType.Bishop, color: PieceColor.Black, key: 0},
          {type: PieceType.King, color: PieceColor.Black, key: 2},
        ]}
        turnColor={PieceColor.White}
        enabled={true}
        onTurnEnd={() => { }}
      /> */}
      <GameOffline timeframe={{timeOverall: 300, increment: 5}}/>
    </>
  );
}