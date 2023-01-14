import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import Board from "frontend/src/components/pageExclusives/game/GameContainer/Board";
import Content from "frontend/src/components/pageExclusives/index/Content";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";


export default function Home() {
  return (
    <>
      {/* <Content /> */}
      <Board 
        layout={
          new Array<PieceData>(64)
            .fill({type: PieceType.Bishop, color: PieceColor.White}, 5, 8)
            .fill({type: PieceType.Pawn, color: PieceColor.Black}, 9, 13)
            .fill({type: PieceType.Pawn, color: PieceColor.White}, 53, 55)
        }
        isWhiteTurn={true}
        role={PieceColor.White}
        onTurnEnd={()=>{}}
        />
    </>
  );
}