import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import EndModal from "frontend/src/components/pageExclusives/game/MenuModal";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef, useState } from "react";
import { pointsToAction, turnsToColor } from "shared/tools/board";
import { getGameStatus, generateStart, startAndTurnsToBoardLayout, step } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep } from "shared/tools/rep";
import { GameData, GameStatus, GameStatusCatagory, GameTurn, GameViewData, Point, Timeframe, WinReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";

export default function GameOffline(props: { timeframe: Timeframe }) {
  const { timeframe } = props;

  const [game, setGame] = (() => {
    const start = useRef(generateStart());
    return useState<GameData>({
      timeframe: timeframe,
      isRated: false,
      start: start.current,
      timeLastTurn: new Date().getTime(),
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start.current, [])),
      turns: [],
      status: { catagory: GameStatusCatagory.Ongoing}
    })
  })();
  const isModalOpen = new Stateful<boolean>(true);

  let layout = startAndTurnsToBoardLayout(game.start, game.turns);
  const turnColor = turnsToColor(game.turns);

  // layout = [
  //   {type: PieceType.King, color: PieceColor.White, key: 0},
  //   ...(new Array(8).fill(undefined)),
  //   {type: PieceType.Bishop, color: PieceColor.White, key: 0},
  //   ...(new Array(45).fill(undefined)),
  //   {type: PieceType.Pawn, color: PieceColor.Black, key: 1},
  //   ...(new Array(6).fill(undefined)),
  //   {type: PieceType.Bishop, color: PieceColor.Black, key: 2},
  //   {type: PieceType.King, color: PieceColor.Black, key: 3},
  // ];

  return (
    <Layout>
      <Box>
        <Board
          enabled={game.status.catagory === GameStatusCatagory.Ongoing}
          layout={layout}
          turnColor={turnColor}
          onTurnEnd={onTurnEnd}
        />
      </Box>
      <EndModal
        isOpen={isModalOpen}
        status={game.status}
      />
    </Layout>
  );

  function onTurnEnd(from: Point, to: Point, promotionType: PieceType | null) {
    const newLayout = step(layout, from, to, promotionType);
    const newTurns = game.turns.concat({
      action: pointsToAction(from, to),
      whiteTime: 0, //change later
      blackTime: 0, //change later
      promotionType: promotionType,
      rep: boardLayoutToRep(newLayout),
    });
    const newStatus = getGameStatus(newLayout, turnColor, newTurns, game.startRep);

    setGame({
      ...game,
      turns: newTurns,
      status: newStatus,
    });

    if (newStatus.catagory !== GameStatusCatagory.Ongoing) {
      isModalOpen.set(true);
    }
  }
}