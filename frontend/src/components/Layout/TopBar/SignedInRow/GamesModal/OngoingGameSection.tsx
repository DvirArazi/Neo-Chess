import { Box, Button } from "@mui/material";
import { ModalEmpty, ModalTitle } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import BoardBackground from "frontend/src/components/pageExclusives/game/BoardBackground";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { Player } from "shared/types/game";
import { GameTd } from "shared/types/general";

export default function OngoingGamesSection(props: { ongoingGamesTd: GameTd[] }) {
  const { ongoingGamesTd: initOngoingGamesTd } = props;

  const ongoingGamesTd = new Stateful(initOngoingGamesTd);

  return <>
    <ModalTitle title={'Ongoing Games'} />
    {getOngoingGames()}
  </>

  function getOngoingGames() {
    if (ongoingGamesTd.value.length === 0) {
      return <ModalEmpty text={'You don\'t have any ongoing games at the moment'} />;
    }

    return ongoingGamesTd.value.map(td => <OngoingGameThumbnail data={td} />);
  }
}

function OngoingGameThumbnail(props: { data: GameTd }) {
  const { data } = props;

  const isUserTurn = data.userColor === data.turnColor;

  return <Button sx={{
    fontFamily: `unset !important`,
    textTransform: `unset !important`,
    color: `unset !important`,
  }}>
    <Box sx={{
      margin: `10px`,
      width: `100%`,

      display: `flex`,
      flexDirection: `row`,
      justifyContent: `space-between`,
    }}>

      {/* board thumbnail */}
      <Box sx={{
        padding: `5px`,
        background: `#00bfff`,
        borderRadius: `7.5px`,
      }}>
        <Box sx={{
          position: `relative`,
          width: `110px`,
          height: `110px`,
          borderRadius: `4px`,
          overflow: `hidden`,
        }}>
          <BoardBackground />
        </Box>
      </Box>

      {/* game info */}
      <Box sx={{
        padding: `5px`,

        flex: `1`,
        display: `flex`,
        flexDirection: `column`,
        justifyContent: `space-around`,
        alignItems: `center`,
      }}>
        {getFormatBannerString(data.timeframe, data.isRated)}
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
          justifyContent: `center`,
          alignItems: `center`,
        }}>
          {getPlayer(data.white)}
          <Box sx={{ width: `60px` }}>{'VS'}</Box>
          {getPlayer(data.black)}
        </Box>
        <Box sx={{
          // width: `150px`,
          // marginTop: `5px`,
          fontWeight: `bold`,
          fontSize: `15px`,
          color: isUserTurn ? `#00b300` : `#6666ff`,
          borderRadius: `5px`,
        }}
        >{isUserTurn ? 'Your turn' : 'Opponent\'s turn'}</Box>
      </Box>

    </Box>
  </Button>

  function getPlayer(player: Player) {
    return <Box>
      <Box sx={{
        whiteSpace: `nowrap`,
        fontWeight: `bold`,
        fontSize: `15px`,
        lineHeight: `15px`,
      }}>{player.name}</Box>
      <Box>{player.rating}</Box>
    </Box>;
  }
}