import { Box } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/GameContainer/Board";
import { SOCKET } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/stateful";
import { BoardLayout } from "frontend/src/utils/types";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameViewData } from "shared/types/gameTypes";

export default function GameContainer(props: {data: GameViewData}) {
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

  const layout = new Stateful<BoardLayout>(startAndTurnsToBoardLayout(start, turns));

  SOCKET.on("playerMoved", (start, end) => {

  });

  return (
    <Layout>
      <Box sx={{ background: `blue` }}>
        <Board
          layout={layout.value}
          role={role}
          onTurnEnd={(start, end) => {
            SOCKET.emit("playerMove", id, start, end);
          }}
        />
      </Box>
    </Layout>
  );
}