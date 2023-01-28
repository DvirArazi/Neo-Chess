import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import Clock from "frontend/src/components/pageExclusives/game/clock";
import { IconName } from "frontend/src/utils/types/iconName";
import { getCapturedCountsWithoutPawns, getCapturedCountsWithPawns } from "shared/tools/boardLayout";
import { getOppositeColor, pieceDataToIconName } from "shared/tools/piece";
import { BoardLayout, PieceCount } from "shared/types/boardLayout";
import { PieceColor } from "shared/types/piece";

export default function PlayerBunner(props: {
  name: string,
  rating: number | null,
  timeLeftMil: number,
  isTicking: boolean,
  initDateTimeMil: number,
  color: PieceColor,
  isOnTop: boolean,
  isWide: boolean,
  isUntimed: boolean,
  layout: BoardLayout,
}) {
  const {
    name,
    rating,
    timeLeftMil,
    isTicking,
    initDateTimeMil,
    color,
    isOnTop,
    isWide,
    isUntimed,
    layout
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
    }}>
      <Box sx={{ textAlign: `left` }}>
        <Box sx={{ fontSize: `16px` }}>{name}</Box>
        <Box sx={{ fontSize: `14px` }}>{rating}</Box>
      </Box>
      {
        isUntimed ? <></> :
        <Clock
          timeLeftMil={timeLeftMil}
          isTicking={isTicking}
          initDateTimeMil={initDateTimeMil}
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
        pieces.push(<MiniPiece
          iconName={pieceDataToIconName({ type: pieceCount.type, color: oppositeColor })}
          x={crntX}
        />);

        crntX += 7;
      }

      crntX += 12;
    }

    return <Box sx={{ position: `relative`, height: `25px` }}>{pieces}</Box>;
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