import { Box, Button } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import BoardBackground from "frontend/src/components/pageExclusives/game/BoardBackground";
import { gameStatusToMessage, getFormatBannerString } from "frontend/src/utils/tools/general";
import { useRouter } from "next/router";
import { BOARD_SIDE } from "shared/tools/boardLayout";
import { pieceDataToIconName } from "shared/tools/piece";
import { GameStatusCatagory, Player } from "shared/types/game";
import { GameTd } from "shared/types/general";
import { PieceColor } from "shared/types/piece";

export default function GameThumbnail(props: { data: GameTd }) {
    const router = useRouter();
  
    const {
      path,
      white,
      black,
      layout,
      userColor,
      turnColor,
      timeframe,
      isRated,
      status,
    } = props.data;
  
    const isUserTurn = userColor === turnColor;
    const borderColor = status.catagory === GameStatusCatagory.Ongoing ?
      isUserTurn ? `#00b300` : `#6666ff` :
      status.catagory === GameStatusCatagory.Win ? status.winColor === userColor ? `#00cc00` : `#ff0000` :
      `#bfbfbf`;
  
    return <Button
      onClick={() => { router.push(`/game/${path}`); }}
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
        <Box>
        <Box sx={{
          borderStyle: `solid`,
          borderWidth: `3.5px`,
          borderColor: borderColor,
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
        </Box>
  
        {/* game info */}
        <Box sx={{
          padding: `0 5px`,
  
          flex: `1`,
          display: `flex`,
          flexDirection: `column`,
          justifyContent: `space-around`,
          alignItems: `center`,
        }}>
          <Box sx={{paddingBottom: `6px`, fontFamily: `robotoslab`}}>
            {getFormatBannerString(timeframe, isRated)}
          </Box>
          <Box sx={{
            display: `flex`,
            flexDirection: `row`,
            justifyContent: `center`,
            alignItems: `center`,
          }}>
            {getPlayer(white)}
            <Box sx={{ width: `60px`, fontFamily: `robotoslab` }}>{'VS'}</Box>
            {getPlayer(black)}
          </Box>
          <Box sx={{
            padding: `0 15px`,
            fontWeight: `bold`,
            fontSize: `15px`,
            color: borderColor,
            lineHeight: `20px`,
          }}
          >{
            status.catagory === GameStatusCatagory.Ongoing ?
              isUserTurn ? 'Your turn' : 'Opponent\'s turn' :
              gameStatusToMessage(status)
          }</Box>
        </Box>
  
      </Box>
    </Button>
  
    function getPlayer(player: Player) {
      return <Box>
        <Box sx={{
          flex: `1`,
          whiteSpace: `nowrap`,
          fontWeight: `bold`,
          fontSize: `15px`,
          lineHeight: `15px`,
        }}>{player.name}</Box>
        <Box sx={{
          fontSize: `14px`,
          fontWeight: player.ratingMod === null ? `` : `bold`,
          color: player.ratingMod === null ? `black` : (player.ratingMod >= 0 ? `#00cc00` : `#ff0000`)
        }}>{
          (player.rating === null ? '' : Math.floor(player.rating)) +
            (player.ratingMod === null ? '' : 
              (player.ratingMod >= 0 ? ` + ${Math.floor(player.ratingMod)}` : ` − ${Math.floor(Math.abs(player.ratingMod))}`)
            )
        }</Box>
      </Box>;
    }
  
    function getPieces(): JSX.Element {
      return <>{layout
        .map((square, i) => {
          if (square === null) return null;
  
          const pos = userColor === PieceColor.White ? BOARD_SIDE ** 2 - 1 - i : i;
  
          return <Box key={i}
            sx={{
              position: `absolute`,
              left: `${pos % BOARD_SIDE * 100 / BOARD_SIDE}%`,
              top: `${Math.floor(pos / BOARD_SIDE) * 100 / BOARD_SIDE}%`,
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