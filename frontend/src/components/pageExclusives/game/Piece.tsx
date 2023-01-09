import { Box } from "@mui/material";
import localFont from "@next/font/local";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";
import Lodash from 'lodash';
import Icon from "../../Icon";

export default function Piece(props: { data: PieceData }) {
  const { data } = props;

  return (
    // <Box sx={{
    //   background: 'green',
    //   width: `100%`,
    //   height: `100%`,
    //   maxHeight: `100%`,
    // }}>
    <Icon path={`chess/${pieceDataToIconName(data)}`} />
    // </Box>
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