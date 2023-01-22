import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
import { turnsToColor } from "shared/tools/board";
import { pointToIndex, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
import { BoardLayout } from "shared/types/boardLayout";
import { GameStatusCatagory, GameStatus, GameTurn, GameViewData } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function GameOnline(props: { data: GameViewData }) {
  const {
    id,
    role,
    white,
    black,
    isRated,
    start,
    timeframe,
    turns,
  } = props.data;

  const gameTurns = new Stateful<GameTurn[]>(turns);
  const layout = new Stateful<BoardLayout>(startAndTurnsToBoardLayout(start, gameTurns.value));
  const turnColor = new Stateful<PieceColor>(turnsToColor(gameTurns.value));
  const gameStatus = new Stateful<GameStatus>({ catagory: GameStatusCatagory.Ongoing });
  const openModal = new Stateful<boolean>(false);

  //I think I can turn layout and turnColor to ragular variables and update them here according to gameTurns

  SOCKET.off("playerMoved");
  SOCKET.on("playerMoved", (gameId, turn, status) => {
    if (id.toString() !== gameId.toString()) return;

    const newTurns = gameTurns.value.concat(turn);
    gameTurns.set(newTurns);
    layout.set(startAndTurnsToBoardLayout(start, newTurns))
    turnColor.set(turnsToColor(newTurns))
    gameStatus.set(status);

    if (status.catagory !== GameStatusCatagory.Ongoing) {
      openModal.set(true);
    }
  });

  return (
    <Layout>
      <Box>
        <Board
          enabled={role === turnColor.value &&
            gameStatus.value.catagory === GameStatusCatagory.Ongoing}
          layout={layout.value}
          turnColor={turnColor.value}
          onMove={() => { }}
          onPromotion={() => { }}
          onTurnEnd={() => {
            // turnColor.set(getOppositeColor(turnColor.value));
            // SOCKET.emit("playerMove", id, from, to, promotionType);
          }} isFlipped={false} flipPieces={false}
        />
      </Box>
      <Modal
        open={openModal.value}
        onClose={() => { openModal.set(false) }}
      >
        <Box>
          Hello citizens!
        </Box>
      </Modal>
    </Layout>
  );
}

