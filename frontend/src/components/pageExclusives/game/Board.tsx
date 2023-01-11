import { Box } from "@mui/material";
import Background from "frontend/src/components/pageExclusives/game/Board/Background";
import { Dot, Highlight } from "frontend/src/components/pageExclusives/game/Board/Visuals";
import Piece from "frontend/src/components/pageExclusives/game/Board/Piece";
import Stateful from "frontend/src/utils/stateful";
import { BoardLayout } from "frontend/src/utils/types";
import { useRef } from "react";
import { BOARD_SIDE } from "shared/globals";
import { getLegalMoves } from "shared/tools/boardLayout";
import { GameRole, Point } from "shared/types/gameTypes";
import Lodash from "lodash";

export const SQUARE_SIZE = 1 / BOARD_SIDE * 100;

let fraction: Point | undefined = undefined;

export default function Board(props: { layout: BoardLayout, role: GameRole }) {
  const { role, layout } = props;

  
  const legalMoves = new Stateful<Point[]>([{ x: 1, y: 2 }]);
  const visuals = new Stateful<JSX.Element[]>([]);
  const startPos = new Stateful<Point>({ x: 0, y: 0 });
  let preventDefault = false;
  console.log("legalMoves", legalMoves.value);

  const boxRef = useRef<HTMLElement>(null);

  const onEnd = () => {
    preventDefault = true;
    console.log("this is the end", legalMoves);
    if (fraction === undefined) return undefined;

    const endPos = fractionToPosition(fraction);
    // console.log(legalMoves.value, endPos);

    if (Lodash.some(legalMoves.value, endPos)) {
      const sI = startPos.value.y * BOARD_SIDE + startPos.value.x;
      const eI = endPos.y * BOARD_SIDE + endPos.x;
      layout[eI] = layout[sI];
      layout[sI] = undefined;
      visuals.set([]);
      // legalMoves.set([]);
      return fraction;
    }

    return undefined;
  }

  let pieces: JSX.Element[] = [];
  for (let i = 0; i < layout.length; i++) {
    const pieceData = layout[i];

    if (pieceData === undefined) continue;

    pieces.push(
      <Piece key={i}
        data={pieceData}
        index={i}
        isEnabled={pieceData.color === role}

        onStart={() => {
          preventDefault = true;
          if (fraction === undefined) return;

          const pos = fractionToPosition(fraction);
          const moves = getLegalMoves(layout, true, pos);
          if (moves.ok) {
            console.log("here maybe?", legalMoves.value)
            startPos.set(pos);
            visuals.set([
              ...moves.value.map((move, i) =>
                <Dot key={i} position={move} onPressed={onEnd} />
              ),
              ...[<Highlight key={-1} position={pos} />]
            ]);
            legalMoves.set(moves.value);
          }
        }}

        onEnd={() => undefined}//onEnd}
      />
    );
  }

  return (
    <Box ref={boxRef}
      onMouseMove={(e) => {
        const rect = boxRef.current?.getBoundingClientRect();
        if (rect === undefined) return;
        if (
          e.clientX < rect.left || e.clientX > rect.right ||
          e.clientY < rect.top || e.clientY > rect.bottom) {
          fraction = undefined;
        } else {
          fraction = {
            x: (e.clientX - rect.x) / rect.width,
            y: (e.clientY - rect.y) / rect.height,
          };
        }
        console.log(legalMoves.value);
      }}
      onMouseDown={function (this: any, e) {
        console.log("mouse down")

        visuals.set([]);
        // legalMoves.set([]);
      }}
      sx={{
        position: `relative`,
        width: `100%`,
        height: `0`,
        paddingBottom: `100%`,
        boxSizing: `border-box`,
        overflow: `hidden`,
      }}
    >
      <Background />
      {pieces}
      {visuals.value}
    </Box>
  );
}

function fractionToPosition(fraction: Point) {
  return {
    x: Math.floor(fraction.x * BOARD_SIDE),
    y: Math.floor(fraction.y * BOARD_SIDE),
  };
}