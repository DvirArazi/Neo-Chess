import { Box, Button } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { ModalEmpty, ModalTitle } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import BoardBackground from "frontend/src/components/pageExclusives/game/BoardBackground";
import { getFormatBannerString } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRouter } from "next/dist/client/router";
import { BOARD_SIDE } from "shared/tools/boardLayout";
import { pieceDataToIconName } from "shared/tools/piece";
import { Player } from "shared/types/game";
import { GameTd } from "shared/types/general";

export default function OngoingGamesSection(props: { ongoingGamesTd: GameTd[] }) {
  const { ongoingGamesTd } = props;

  return <>
    <ModalTitle title={'Ongoing Games'} />
    {getOngoingGames()}
  </>

  function getOngoingGames() {
    if (ongoingGamesTd.length === 0) {
      return <ModalEmpty text={'You don\'t have any ongoing games at the moment'} />;
    }

    return ongoingGamesTd.map(td => <OngoingGameThumbnail key={td.path} data={td} />);
  }
}

function OngoingGameThumbnail(props: { data: GameTd }) {
  const {
    path,
    white,
    black,
    layout,
    userColor,
    turnColor,
    timeframe,
    isRated,
  } = props.data;

  const router = useRouter();

  const isUserTurn = userColor === turnColor;

  return <Button
    onClick={() => { window.location.pathname = `game/${path}`; }}
    sx={{
      fontFamily: `unset !important`,
      textTransform: `unset !important`,
      color: `unset !important`,
    }}
  >
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
          {getPieces()}
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
        {getFormatBannerString(timeframe, isRated)}
        <Box sx={{
          display: `flex`,
          flexDirection: `row`,
          justifyContent: `center`,
          alignItems: `center`,
        }}>
          {getPlayer(white)}
          <Box sx={{ width: `60px` }}>{'VS'}</Box>
          {getPlayer(black)}
        </Box>
        <Box sx={{
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

  function getPieces(): JSX.Element {
    return <>{layout
      .map((square, i) => {
        if (square === null) return <></>;

        return <Box key={i}
          sx={{
            position: `absolute`,
            left: `${i % BOARD_SIDE * 100 / BOARD_SIDE}%`,
            top: `${Math.floor(i / BOARD_SIDE) * 100 / BOARD_SIDE}%`,
            transform: `translateY(-3px)`,
            width: `${100 / BOARD_SIDE}%`
          }}
        >
          <Icon name={pieceDataToIconName(square)} />
        </Box>
      })
    }</>
  }
}