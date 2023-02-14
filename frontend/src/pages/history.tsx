import { Box, Divider, Grid } from "@mui/material";
import GameThumbnail from "frontend/src/components/GameThumbnail";
import Empty from "frontend/src/components/Empty";
import { SOCKET, USER_DATA } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import Error from "next/error";
import { useEffect } from "react";
import { GameTd } from "shared/types/general";
import { AAD_COOKIE } from "frontend/src/utils/tools/cookies";

export default function history() {
  const aad = AAD_COOKIE.get();

  const gamesTd = new Stateful<GameTd[] | "loading" | "404">("loading");

  useEffect(() => {
    if (aad !== undefined && USER_DATA === undefined) return;

    SOCKET.emit("getHistoryGames", (newGames) => {
      gamesTd.set(newGames);
    });
  }, [aad, USER_DATA]);


  if (gamesTd.value === "loading") return <Empty message='Loading...' />;

  if (gamesTd.value === "404") return <Error statusCode={404} />;

  return <Box sx={{
    display: `flex`,
    flexDirection: `column`,
    alignItems: `center`,
  }}>
    <Box sx={{
      fontFamily: `robotoslab`,
      fontSize: `30px`,
      padding: `10px`,
    }}>{'Games History'}</Box>
    <Box sx={{ width: `100%`, maxWidth: `500px` }}>
      <Divider variant="middle" />
    </Box>
    <Box sx={{ height: `10px` }} />
    {
      gamesTd.value.length === 0 ?
        <Empty message={'You don\'t yet have any games in your history'} /> :
        <Grid container spacing={0}
          // direction="column"
          alignItems="center"
          justifyContent="center"
        >{
            gamesTd.value.map(gameTd =>
              <Grid key={gameTd.path} sx={{ maxWidth: `500px` }}>
                <GameThumbnail data={gameTd} />
              </Grid>
            )
          }</Grid>
    }
  </Box>;
}