import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
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

  const gameStatus = new Stateful<GameStatus>({ catagory: GameStatusCatagory.Ongoing });
  const gameTurns = new Stateful<GameTurn[]>(turns);
  const openModal = new Stateful<boolean>(false);
  const turnColor = new Stateful<PieceColor>(PieceColor.White);

  const boardRef = useRef<Board>(null);

  const layout = startAndTurnsToBoardLayout(start, gameTurns.value);
  const turnColor = gameTurns.value.length % 2 == 0 ?
    PieceColor.White :
    PieceColor.Black;

  boardRef.current?.update(layout, turnColor.value);

  SOCKET.on("playerMoved", (gameId, gameTurns, status) => {
    if (id.toString() !== gameId.toString()) return;

    const newTurns = gameTurns.value.concat(gameTurns)
    gameTurns.set(newTurns);
    gameStatus.set(status);
    turnColor.set(newTurns.length % 2 == 0 ? PieceColor.White : PieceColor.Black)

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
          turnColor={turnColor.value}
          onTurnEnd={(from, to, promotion) => {
            turnColor.set(getOppositeColor(turnColor.value));

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