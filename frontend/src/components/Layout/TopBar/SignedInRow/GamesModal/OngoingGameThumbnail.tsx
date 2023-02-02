import { Box, Button } from "@mui/material";
import ModalTitle from "frontend/src/components/Layout/TopBar/SignedInRow/ModalTitle";
import BoardBackground from "frontend/src/components/pageExclusives/game/BoardBackground";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import { Player } from "shared/types/game";
import { GameTd } from "shared/types/general";

export default function OngoingGamesThumbnail(props: { ongoingGamesTd: GameTd[] }) {
  const { ongoingGamesTd } = props;

  return <>
    <ModalTitle title={'Ongoing Games'} />
    {ongoingGamesTd.map(td => <OngoingGameThumbnail data={td} />)}
  </>
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