import Content from "frontend/src/components/pageExclusives/index/Content";
import Board from "frontend/src/components/pageExclusives/game/Board";
import { isInCheckmate, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";
import GameOffline from "frontend/src/components/pageExclusives/game/GameOffline";
export default function Home() {
  return <>
    <Content />
  </>;
}