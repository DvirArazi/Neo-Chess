import Content from "frontend/src/components/pageExclusives/index/Content";
import Board from "frontend/src/components/pageExclusives/game/Board";
import { isInCheckmate, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";
import GameOffline from "frontend/src/components/pageExclusives/game/GameOffline";
import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { BoardLayout } from "shared/types/boardLayout";
import { Point } from "shared/types/game";
import { THEME } from "frontend/src/pages/_app";


export default function Home() {
  return <>
    <Content />
    {/* <GameOffline timeframe={{ overallSec: 10*60, incSec: 5 }} /> */}
  </>;
}