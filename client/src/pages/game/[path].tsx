import { Box } from "@mui/material";
import Layout from "client/src/components/Layout";
import Board from "client/src/components/pageExclusives/game/Board";
import Stateful from "client/src/utils/stateful";
import { useRouter } from "next/router";
import { GameViewData } from "shared/types";
import { SOCKET } from "../_app";

export default function Game() {
  const router = useRouter();
  const { path } = router.query;
  const gameViewData = new Stateful<GameViewData | undefined>(undefined);

  SOCKET.emit("getGameViewData", path as string, (data) => {
    gameViewData.set(data);
  });

  if (gameViewData.value === undefined) {
    return (
      <Box>
        404
      </Box>
    );
  }

  const {
    role,
    white,
    black,
    history,
    settings,
  } = gameViewData.value;

  return (
    <Layout>
      <Box sx={{ background: `blue` }}>
        <Board layout={history[history.length - 1]} />
      </Box>
    </Layout>
  );
}

// export async function getServerSideProps(context: GetServerSidePropsContext): Promise<Props> {
//   const { res, params } = context;
//   const { path } = params!;

//   const gameViewData = await new Promise<GameViewData | undefined>((resolve) => {
//     SOCKET.emit("getGameViewData", path as string, resolve);
//   });

//   if (gameViewData === undefined) {
//     res.statusCode = 404;
//   }

//   return { gameViewData: gameViewData! };
// }