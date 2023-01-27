import { Box } from "@mui/material";
import GameOnline from "frontend/src/components/pageExclusives/game/GameOnline";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { SOCKET } from "../_app";
export default function Game() {
    var router = useRouter();
    var path = router.query.path;
    var gameViewData = new Stateful("loading");
    useEffect(function () {
        SOCKET.emit("getGameViewData", path, function (data) {
            gameViewData.set(data);
        });
    }, []);
    if (gameViewData.value === "loading") {
        return (<Box>
        Loading
      </Box>);
    }
    if (gameViewData.value === "404") {
        return (<Box>
        404
      </Box>);
    }
    return <GameOnline data={gameViewData.value}/>;
}
