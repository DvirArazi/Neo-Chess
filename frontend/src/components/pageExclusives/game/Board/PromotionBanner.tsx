import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { pieceDataToIconName } from "frontend/src/components/pageExclusives/game/Board";
import Piece from "frontend/src/components/pageExclusives/game/Board/Piece";
import { PieceCount } from "shared/types/boardLayout";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";

const heightPercent = 40;
const insideHeightPercent = 55;

export default function PromotionBanner(props: {
  color: PieceColor,
  pieceCounts: PieceCount[],
  onChoice: (type: PieceType) => void,
}) {
  const { color, pieceCounts, onChoice } = props;

  const displayPieces: JSX.Element[] = [];

  for (let i = 0; i < pieceCounts.length; i++) {
    if (pieceCounts[i].count <= 0) continue;

    displayPieces.push(<DisplayPiece key={i}
      data={{ type: pieceCounts[i].type, color: color }}
      count={pieceCounts[i].count}
      onChoice={onChoice}
    />)
  }

  return (
    <Box sx={{
      position: `absolute`,
      left: `0%`,
      top: `0%`,
      width: `100%`,
      height: `100%`,
      zIndex: `30`,
      background: `rgba(50, 50, 50, 0.4)`,
    }}>
      <Box
        sx={{
          position: `absolute`,
          left: `0%`,
          top: `${(100 - heightPercent) / 2}%`,
          width: `100%`,
          height: `${heightPercent}%`,
          zIndex: `30`,
          background: `rgba(255, 255, 255, 0.5)`,
          boxShadow: `0px 0px 20px -0px rgba(0,0,0,0.2)`,

        }}
      >
        <Box sx={{
          position: `absolute`,
          top: `${(100 - insideHeightPercent) / 2}%`,
          width: `100%`,
          height: `${insideHeightPercent}%`,
          display: `flex`,
          flexDirection: `row`,
          justifyContent: `center`,
        }}>
          {displayPieces}
        </Box>
      </Box>
    </Box>
  );
}

const pieceSidePercent = 50;

function DisplayPiece(props: {
  data: PieceData,
  count: number,
  onChoice: (type: PieceType) => void
}) {
  const { data, count, onChoice } = props;
  return (
    <Box
      sx={{
        position: `relative`,
        width: `%${pieceSidePercent}%`,
        height: `%${pieceSidePercent}%`,
        ":hover": {
          cursor: `pointer`,
        }
      }}
      onMouseDown={() => onChoice(data.type)}
    >
      <Icon path={`chess/${pieceDataToIconName(data)}`} />
      <Box>{`x${count}`}</Box>
    </Box>
  )
}