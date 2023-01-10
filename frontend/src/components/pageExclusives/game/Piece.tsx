import { Box } from "@mui/material";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";
import Lodash from 'lodash';
import Icon from "../../Icon";
import { BOARD_SIDE } from "shared/globals";
import Draggable, { ControlPosition } from "react-draggable";
import Stateful from "frontend/src/utils/stateful";
import { Point } from "shared/types/gameTypes";
import { useRef } from "react";

export default function Piece(props: {
  data: PieceData,
  index: number,
  size: number,
  getFraction: () => Point | undefined,
}) {
  const { data, index, size, getFraction } = props;

  //getFraction get a fracPosition param
  //the first getFraction passes the startFracPosition
  //[path] finds every possible move 
  //and the second getFraction passes the endFracPosition
  //after the second is sent, the [path] checks if the move is legal
  //if so, it returns back the new fraction and sends to the server the move
  //the server checks if the move is legal again, and if so, commits it to the db
  //and sends it to the other player

  const fracPosition = new Stateful<Point>({
    x: Math.floor(index % BOARD_SIDE) * size,
    y: Math.floor(index / BOARD_SIDE) * size,
  });
  let fracOffset: Point = {x: 0, y: 0};

  const nodeRef = useRef(null);
  return (
    <Draggable nodeRef={nodeRef}
      position={{ x: 0, y: 0 }}
      onStart={() => {
        const fraction = getFraction();
        if (fraction === undefined) return;
        fracOffset = { x: fraction.x, y: fraction.y };
      }}
      onStop={() => {
        const fraction = getFraction();
        if (fraction === undefined) return;
        const pos = {
          x: Math.floor((fraction.x - fracOffset.x) * BOARD_SIDE + Math.floor(fracOffset.x * BOARD_SIDE) + 0.5) * size,
          y: Math.floor((fraction.y - fracOffset.y) * BOARD_SIDE + Math.floor(fracOffset.y * BOARD_SIDE) + 0.5) * size,
        };
        console.log(`${pos.x}, ${pos.y}`);
        fracPosition.set({
          x: Math.floor((fraction.x - fracOffset.x) * BOARD_SIDE + Math.floor(fracOffset.x * BOARD_SIDE) + 0.5) * size,
          y: Math.floor((fraction.y - fracOffset.y) * BOARD_SIDE + Math.floor(fracOffset.y * BOARD_SIDE) + 0.5) * size,
        });
      }}
    >
      <Box ref={nodeRef}
        sx={{
          position: `absolute`,
          left: `${fracPosition.value.x}%`,
          top: `${fracPosition.value.y}%`,
          width: `${size}%`,
          height: `${size}%`,
          cursor: `default`,
          ":hover": {
            cursor: `pointer`,
          },
        }}
      >
        <Icon path={`chess/${pieceDataToIconName(data)}`}/>
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