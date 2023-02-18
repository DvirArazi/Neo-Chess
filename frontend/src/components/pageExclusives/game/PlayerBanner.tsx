import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import Clock from "frontend/src/components/pageExclusives/game/clock";
import { IconName } from "frontend/src/utils/types/iconName";
import { getCapturedCountsWithoutPawns, getCapturedCountsWithPawns } from "shared/tools/boardLayout";
import { getOppositeColor, pieceDataToIconName } from "shared/tools/piece";
import { BoardLayout, PieceCount } from "shared/types/boardLayout";
import { PieceColor } from "shared/types/piece";

export default function PlayerBanner(props: {
  name: string,
  rating: number | null,
  ratingMod: number | null,
  timeLeftMs: number,
  isTicking: boolean,
  initDateTimeMs: number,
  color: PieceColor,
  isOnTop: boolean,
  isWide: boolean,
  isUntimed: boolean,
  layout: BoardLayout,
  advantage: number,
  isTurned: boolean,
}) {
  const {
    name,
    rating,
    ratingMod,
    timeLeftMs,
    isTicking,
    initDateTimeMs,
    color,
    isOnTop,
    isWide,
    isUntimed,
    layout,
    advantage,
    isTurned: isFlipped,
  } = props;

  const oppositeColor = getOppositeColor(color);

  return <Box sx={{ margin: `10px`, }}>
    {
      isOnTop ?
        <>
          {getMainRow()}
          {getMiniPieces()}
        </> :
        <>
          {getMiniPieces()}
          {getMainRow()}
        </>
    }
  </Box>

  function getMainRow() {
    return <Box sx={{
      display: `flex`,
      flexDirection: `row`,
      justifyContent: `space-between`,
      alignItems: `center`,
      minHeight: `30px`,
      transform: isFlipped ? `rotate(0.5turn)` : `none`
    }}>
      <Box sx={{ textAlign: `left` }}>
        <Box sx={{ fontSize: `16px`, fontWeight: `600` }}>{name}</Box>
        <Box sx={{
          fontSize: `14px`,
          fontWeight: ratingMod === null ? `` : `bold`,
          color: ratingMod === null ? `black` : (ratingMod >= 0 ? `#00cc00` : `#ff0000`)
        }}>{
          (rating === null ? '' : Math.floor(rating)) +
            (ratingMod === null ? '' : 
              (ratingMod >= 0 ? ` + ${Math.floor(ratingMod)}` : ` − ${Math.floor(Math.abs(ratingMod))}`)
            )
        }</Box>
      </Box>
      {
        isUntimed ? <></> :
          <Clock
            timeLeftMil={timeLeftMs}
            isTicking={isTicking}
            initDateTimeMil={initDateTimeMs}
            isWide={isWide}
          />
      }
    </Box>;
  }

  function getMiniPieces() {
    let pieces: JSX.Element[] = [];

    const capturedCounts = getCapturedCountsWithPawns(layout, oppositeColor);

    let crntX = 0;
    for (const pieceCount of capturedCounts) {
      if (pieceCount.count === 0) continue;
      for (let i = 0; i < pieceCount.count; i++) {        
        pieces.push(<MiniPiece key={crntX}
          iconName={pieceDataToIconName({ type: pieceCount.type, color: oppositeColor })}
          x={crntX}
        />);

        crntX += 7;
      }

      crntX += 12;
    }
    return <Box sx={{
      position: `relative`,
      height: `25px`,
      transform: isFlipped ? `rotate(0.5turn)` : `none`
      }}>
      {pieces}
      <Box sx={{
        fontFamily: `robotoslab`,
        position: `absolute`,
        left: `${crntX + 5}px`,
        top: `3px`,
      }}>
        {advantage > 0 ? `+${advantage}` : advantage < 0 ? `−${advantage * -1}` : ``}
      </Box>
    </Box>;
  }
}

function MiniPiece(props: { iconName: IconName, x: number }) {
  const { iconName, x, } = props;

  return <Box sx={{
    position: `absolute`,
    left: `${x}px`,
    height: `100%`,
  }}>
    <Icon name={iconName} />
  </Box>
}