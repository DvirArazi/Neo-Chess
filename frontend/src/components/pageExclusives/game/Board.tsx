import { Box } from "@mui/material";
import { BoardLayout } from "frontend/src/utils/types";
import { useEffect } from "react";
import { useRef } from "react";
import { BOARD_SIDE } from "shared/globals";
import { Point } from "shared/types/gameTypes";
import Background from "./Board/Background";
import Piece from "./Piece";

export default function Board(props: { layout: BoardLayout }) {
  const size = 1 / BOARD_SIDE * 100;

  const { layout } = props;

  let fraction: Point | undefined = undefined;
  const boxRef = useRef<HTMLElement>(null);

  let children: JSX.Element[] = [];
  for (let i = 0; i < layout.length; i++) {
    const pieceData = layout[i];

    if (pieceData === undefined) continue;

    children.push(
        <Piece
          key={i}
          data={pieceData}
          index={i}
          size={size}
          getFraction={()=>fraction}
        />
    );
  }

  return (
    <Box ref={boxRef}
      onMouseMove={(e)=>{
        const rect = boxRef.current?.getBoundingClientRect();
        if (rect === undefined) return;
        if (
          e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top || e.clientY > rect.bottom)
        {
          fraction = undefined;
        } else {
          fraction = {
            x: (e.clientX-rect.x)/rect.width,
            y: (e.clientY-rect.y)/rect.height,
          };
        }
        // console.log(fraction);
      }}
      sx={{
        position: `relative`,
        width: `100%`,
        height: `0`,
        paddingBottom: `100%`,
        boxSizing: `border-box`,
      }}
    >
      <Background/>
      {children}
      
    </Box>
  );
}