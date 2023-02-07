import { Box } from "@mui/material";
import { THEME } from "frontend/src/pages/_app";
import { useEffect, useRef } from "react";
import { BOARD_SIDE } from "shared/tools/boardLayout";

export default function BoardBackground() {
  const resolution = 1;

  return (
    <Box sx={{}}>
      <svg
        viewBox={`0 0 ${BOARD_SIDE} ${BOARD_SIDE}`}
        // ref={canvasRef}
        // width={BOARD_SIDE * resolution}
        // height={BOARD_SIDE * resolution}
        style={{
          position: `absolute`,
          left: `0%`,
          background: THEME.boardLight,
          imageRendering: `pixelated`,
          width: `100%`,
          height: `100%`,
        }}
      >
        {
          getSquares()
        }
      </svg>
    </Box>
  );

  function getSquares() {
    const squares: JSX.Element[] = [];

    for (let i = 0; i < BOARD_SIDE ** 2; i += 2) {
      const y = Math.floor(i / BOARD_SIDE);
      squares.push(
        <rect key={i}
          x={i % BOARD_SIDE + y % 2}
          y={y}
          width={1}
          height={1}
          style={{ fill: THEME.boardDark }}
        />
      );
    }

    return squares;
  }
}