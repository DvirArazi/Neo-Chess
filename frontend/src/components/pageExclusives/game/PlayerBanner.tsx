import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import Clock from "frontend/src/components/pageExclusives/game/clock";
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
  layout: BoardLayout,
}) {
  const { name, rating, timeLeftMil, isTicking, initDateTimeMil, color, layout } = props;
  const oppositeColor = getOppositeColor(color);

  return <Box sx={{ margin: `10px`, }}>
    <Box sx={{
      display: `flex`,
      flexDirection: `row`,
      justifyContent: `space-between`,
      alignItems: `center`,
    }}>
      <Box sx={{ textAlign: `left` }}>
        <Box sx={{ fontSize: `16px` }}>{name}</Box>
        <Box sx={{ fontSize: `14px` }}>{rating}</Box>
      </Box>
      <Clock
        timeLeftMil={timeLeftMil}
        isTicking={isTicking}
        initDateTimeMil={initDateTimeMil}
      />
    </Box>
    {getMiniPieces()}
  </Box>

  function getMiniPieces() {
    let pieces: JSX.Element[] = [];

    const capturedCounts = getCapturedCountsWithPawns(layout, oppositeColor);

    let crntX = 0;
    for (const pieceCount of capturedCounts) {
      if (pieceCount.count === 0) continue;
      for (let i = 0; i < pieceCount.count; i++) {
        pieces.push(<MiniPiece
          pieceName={pieceDataToIconName({ type: pieceCount.type, color: oppositeColor })}
          x={crntX}
        />);

        crntX += 7;
      }

      crntX += 12;
    }

    return <Box sx={{ position: `relative`, height: `25px` }}>{pieces}</Box>;
  }
}

function MiniPiece(props: { pieceName: string, x: number }) {
  const { pieceName, x, } = props;

  return <Box sx={{
    position: `absolute`,
    left: `${x}px`,
    height: `100%`,
  }}>
    <Icon path={`chess/${pieceName}`} />
  </Box>
}