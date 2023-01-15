import { Box } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/GameContainer/Board";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameTurn, GameViewData } from "shared/types/game";
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
  const boardRef = useRef<Board>(null);

  const layout = startAndTurnsToBoardLayout(start, gameTurns.value);
  const turnColor = gameTurns.value.length % 2 == 0 ?
    PieceColor.White :
    PieceColor.Black
  ;

  boardRef.current?.update(layout, turnColor);

  SOCKET.on("playerMoved", (gameTurn) => {
    const t = gameTurns.value.concat(gameTurn);
    gameTurns.set(t);
  });

  return (
    <Layout>
      <Box>
        <Board ref={boardRef}
          enabled={role === turnColor}
          layout={layout}
          turnColor={turnColor}
          onTurnEnd={(from, to) => {
            SOCKET.emit("playerMove", id, from, to);
          }}
        />
      </Box>
    </Layout>
  );
}