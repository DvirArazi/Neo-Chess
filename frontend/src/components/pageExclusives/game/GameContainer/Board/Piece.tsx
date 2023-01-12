import { Box } from "@mui/material";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";
import Lodash from 'lodash';
import Icon from "../../../../Icon";
import { BOARD_SIDE } from "shared/globals";
import Draggable, { ControlPosition } from "react-draggable";
import Stateful from "frontend/src/utils/stateful";
import { Point } from "shared/types/gameTypes";
import { useRef } from "react";
import { SQUARE_SIZE } from "frontend/src/components/pageExclusives/game/GameContainer/Board";

export default function Piece(props: {
  data: PieceData,
  index: number,
  isEnabled: boolean,
  onStart: () => void,
  onEnd: () => Point | undefined,
}) {
  const { data, isEnabled, index, onStart, onEnd } = props;

  const fracPosition = new Stateful<Point>({
    x: index % BOARD_SIDE * SQUARE_SIZE,
    y: Math.floor(index / BOARD_SIDE) * SQUARE_SIZE,
  });

  const nodeRef = useRef(null);
  return (
    <Draggable nodeRef={nodeRef}
      disabled={!isEnabled}
      position={{ x: 0, y: 0 }}
      onStart={(e) => {
        e.stopPropagation();
        onStart();
      }}
      onStop={(e) => {
        e.stopPropagation();
        const fraction = onEnd();
        if (fraction === undefined) return;
        fracPosition.set({
          x: Math.floor(fraction.x * BOARD_SIDE) * SQUARE_SIZE,
          y: Math.floor(fraction.y * BOARD_SIDE) * SQUARE_SIZE,
        });
      }}
    >
      <Box ref={nodeRef}
        sx={{
          position: `absolute`,
          left: `${fracPosition.value.x}%`,
          top: `${fracPosition.value.y}%`,
          width: `${SQUARE_SIZE}%`,
          height: `${SQUARE_SIZE}%`,
          zIndex: `10`,
          ":hover": {
            cursor: `${isEnabled ? `pointer` : `default`}`,
          },
          ":active": {
            zIndex: `20`,
          },
          //go back to this someday, but not today...
          WebkitTransition: `left 2s ease, top 2s ease`,
          transition: `left 2s ease, top 2s ease`,
        }}
        style={{
          WebkitTransition: `left 2s ease, top 2s ease`,
          transition: `left 2s ease, top 2s ease`,
        }}
      >
        <Icon path={`chess/${pieceDataToIconName(data)}`} />
      </Box>
    </Draggable>
  );
}


const pieceDataToIconName = (data: PieceData): string => {
  const compare = (other: PieceData) => {
    return Lodash.isEqual(data, other);
  }

  if (compare({ type: PieceType.Pawn, color: PieceColor.Black })) return "pawn_black";
  if (compare({ type: PieceType.Bishop, color: PieceColor.Black })) return "bishop_black";
  if (compare({ type: PieceType.Knight, color: PieceColor.Black })) return "knight_black";
  if (compare({ type: PieceType.Rook, color: PieceColor.Black })) return "rook_black";
  if (compare({ type: PieceType.Queen, color: PieceColor.Black })) return "queen_black";
  if (compare({ type: PieceType.King, color: PieceColor.Black })) return "king_black";
  if (compare({ type: PieceType.Pawn, color: PieceColor.White })) return "pawn_white";
  if (compare({ type: PieceType.Bishop, color: PieceColor.White })) return "bishop_white";
  if (compare({ type: PieceType.Knight, color: PieceColor.White })) return "knight_white";
  if (compare({ type: PieceType.Rook, color: PieceColor.White })) return "rook_white";
  if (compare({ type: PieceType.Queen, color: PieceColor.White })) return "queen_white";
  if (compare({ type: PieceType.King, color: PieceColor.White })) return "king_white";

  throw new Error(`PieceData provided does not correlate to any string`);
}