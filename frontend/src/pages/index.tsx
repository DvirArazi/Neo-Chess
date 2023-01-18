import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import Content from "frontend/src/components/pageExclusives/index/Content";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";


export default function Home() {
  return (
    <>
      <Content />
      {/* <Board
        layout={startAndTurnsToBoardLayout([
          PieceType.King,
          PieceType.Queen,
          PieceType.Rook,
          PieceType.Rook,
          PieceType.Knight,
          PieceType.Knight,
          PieceType.Bishop,
          PieceType.Bishop
        ], [])}
        turnColor={PieceColor.White}
        enabled={true}
        onTurnEnd={() => { }}
      /> */}
    </>
  );
}