import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { pointToIndex, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
import { BoardLayout } from "shared/types/boardLayout";
import { GameStatusCatagory, GameStatus, GameTurn, GameViewData } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function GameContainer(props: { data: GameViewData }) {
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
  
  const boardRef = useRef<Board>(null);

  SOCKET.on("playerMoved", (gameId, turn, status) => {
    if (id.toString() !== gameId.toString()) return;

    const newTurns = gameTurns.value.concat(turn);
    gameTurns.set(newTurns);
    layout.set(startAndTurnsToBoardLayout(start, newTurns))
    turnColor.set(turnsToColor(newTurns))
    gameStatus.set(status);

    console.log(status);
    if (status.catagory !== GameStatusCatagory.Ongoing) {
      openModal.set(true);
    }
  });

  return (
    <Layout>
      <Box>
        <Board ref={boardRef}
          enabled={
            role === turnColor.value &&
            gameStatus.value.catagory === GameStatusCatagory.Ongoing
          }
          layout={layout}
          turnColor={turnColor}
          onTurnEnd={(from, to, promotion) => {
            SOCKET.emit("playerMove", id, from, to, promotion);
          }}
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

function turnsToColor(turns: GameTurn[]) {
  return turns.length % 2 == 0 ? PieceColor.White : PieceColor.Black;
}