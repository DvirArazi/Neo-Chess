import { Box } from "@mui/material";
import { BoardLayout } from "frontend/src/utils/types";
import Background from "./Board/Background";
import Piece from "./Piece";

export default function Board(props: { layout: BoardLayout }) {
  const { layout } = props;

  let children: JSX.Element[] = [];
  for (let i = 0; i < layout.length; i++) {
    const pieceData = layout[i];

    if (pieceData === undefined) continue;

    children.push(
      <Box key={i} sx={{
        position: `absolute`,
        left: `${Math.floor(i % SIDE) * SIZE}%`,
        top: `${Math.floor(i / SIDE) * SIZE}%`,
        width: `${SIZE}%`,
        height: `${SIZE}%`,
      }}>
        <Piece data={pieceData} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: `relative` }}>
      <Background side={SIDE} />
      {children}
    </Box>
  );
}

export const SIDE = 8;
const SIZE = 1 / SIDE * 100;