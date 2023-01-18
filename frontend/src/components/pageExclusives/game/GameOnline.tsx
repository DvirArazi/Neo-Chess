import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board2 from "frontend/src/components/pageExclusives/game2/Board2";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
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

  SOCKET.off("playerMoved");
  SOCKET.on("playerMoved", (gameId, turn, status) => {
    if (id.toString() !== gameId.toString()) return;

    console.log('turn: ', turn);

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
        <Board2
          enabled={
            role === turnColor.value &&
            gameStatus.value.catagory === GameStatusCatagory.Ongoing
          }
          layout={layout.value}
          turnColor={turnColor.value}
          onMove={(from, to) => {
            const fromI = pointToIndex(from);
            const toI = pointToIndex(to);

            const newLayout = layout.value;
            newLayout[toI] = newLayout[fromI];
            newLayout[fromI] = undefined;

            layout.set(newLayout);
          }}
          onPromotion={(to, promotionType) => {
            const toI = pointToIndex(to);

            const newLayout = layout.value;
            if (newLayout[toI] === undefined) return;
            newLayout[toI]!.type = promotionType;

            // useEffect(()=> {
            layout.set(newLayout);
            // });
          }}
          onTurnEnd={(from, to, promotionType) => {
            console.log('onTurnEnd');

            // useEffect(() => {
              turnColor.set(getOppositeColor(turnColor.value));
            // });
            SOCKET.emit("playerMove", id, from, to, promotionType);
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