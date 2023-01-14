import { Box } from "@mui/material";
import Icon from "frontend/src/components/Icon";
import { pieceDataToIconName } from "frontend/src/components/pageExclusives/game/GameContainer/Board";
import Piece from "frontend/src/components/pageExclusives/game/GameContainer/Board/Piece";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";

const heightPercent = 40;
const insideHeightPercent = 55;

const pieceTypes: PieceType[] = [
  PieceType.Queen,
  PieceType.Rook,
  PieceType.Knight,
  PieceType.Bishop,
]

export default function PromotionBanner(props: {
  color: PieceColor,
  piecesCounts: number[],
  onChoice: (type: PieceType)=>void,
}) {
  const {color, piecesCounts, onChoice} = props;

  const displayPieces: JSX.Element[] = [];

  for (let i = 0; i < 4; i++) {
    if (piecesCounts[i] <= 0) continue;

    displayPieces.push(<DisplayPiece key={i}
      data={{type: pieceTypes[i], color: color}}
      count={piecesCounts[i]}
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
          top: `${(100-heightPercent)/2}%`,
          width: `100%`,
          height: `${heightPercent}%`,
          zIndex: `30`,
          background: `rgba(255, 255, 255, 0.5)`,
          boxShadow: `0px 0px 20px -0px rgba(0,0,0,0.2)`,
          
        }}
      >
        <Box sx={{
          position: `absolute`,
          top: `${(100-insideHeightPercent)/2}%`,
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
  onChoice: (type: PieceType)=>void
}) {
  const {data, count, onChoice} = props;
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
      onMouseDown={()=>onChoice(data.type)}
    >
      <Icon path={`chess/${pieceDataToIconName(data)}`}/>
      <Box>{`x${count}`}</Box>
    </Box>
  )
}