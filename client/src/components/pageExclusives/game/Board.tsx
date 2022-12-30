import { Box } from "@mui/material";
import { PieceData } from "shared/pieceData";
import Background from "./Board/Background";
import Piece from "./Piece";

export default function Board(props: { layout: BoardLayout }) {
  const { layout } = props;

  

  return (
    <Box sx={{ position: `relative` }}>
      <Background side={SIDE} />
      {
        layout.map((data, i) => {
          if (data == null) return null;

          return (
            <Box sx={{
              position: `absolute`,
              left: `${Math.floor(i % SIDE) * SIZE}%`,
              top: `${Math.floor(i / SIDE) * SIZE}%`,
              width: `${SIZE}%`,
              height: `${SIZE}%`,
            }}>
              <Piece key={i} data={data} />
            </Box>
          );
        })
      }
    </Box>
  );
}

export type BoardLayout = Array<PieceData | null>;

export const SIDE = 8;
const SIZE = 1/SIDE*100;