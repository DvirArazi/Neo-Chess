import GameOnline from "frontend/src/components/pageExclusives/game/GameOnline";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { GameViewData } from "shared/types/game";
import { SOCKET, USER_DATA } from "../_app";
import Error from "next/error";
import Empty from "frontend/src/components/Empty";

export default function Game() {
  const router = useRouter();

  const path = router.query.path as string | undefined;

  const gameViewData = new Stateful<GameViewData | "loading" | "404">("loading");
  const count = useRef(0);

  useEffect(() => {
    if (path === undefined) return;

    SOCKET.emit("getGameViewData", path, (data) => {
      gameViewData.set(data);
    });
  }, [path, USER_DATA]);

  if (gameViewData.value === "loading") return <Empty message='Loading...'/>;

  if (gameViewData.value === "404") return <Error statusCode={404} />;

  return <GameOnline key={count.current++} data={gameViewData.value} />
}