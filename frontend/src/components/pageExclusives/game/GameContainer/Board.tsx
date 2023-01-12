import { Box } from "@mui/material";
import Background from "frontend/src/components/pageExclusives/game/GameContainer/Board/Background";
import { Dot, Highlight } from "frontend/src/components/pageExclusives/game/GameContainer/Board/Visuals";
import Piece from "frontend/src/components/pageExclusives/game/GameContainer/Board/Piece";
import Stateful from "frontend/src/utils/stateful";
import { BoardLayout } from "frontend/src/utils/types";
import { useRef } from "react";
import { BOARD_SIDE } from "shared/globals";
import { getLegalMoves } from "shared/tools/boardLayout";
import { GameRole, MoveError, Point } from "shared/types/gameTypes";
import Lodash from "lodash";
import React from "react";
import { ok } from "shared/tools/result";

export const SQUARE_SIZE = 1 / BOARD_SIDE * 100;

type Props = {
  layout: BoardLayout,
  role: GameRole,
  onTurnEnd: (start: Point, endPos: Point) => void,
}
type State = {
  legalMoves: Point[],
  startPos: Point | undefined,
  layout: BoardLayout,
}
export default class Board extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      legalMoves: [],
      startPos: undefined,
      layout: props.layout,
    };
  }

  private boxRef = React.createRef<HTMLDivElement>();
  private fraction: Point | undefined = undefined;

  render() {
    const onEnd = () => {
      if (this.fraction === undefined) return undefined;

      const endPos = fractionToPosition(this.fraction);

      if (
        this.state.startPos !== undefined &&
        Lodash.some(this.state.legalMoves, endPos)
      ) {
        const sI = this.state.startPos.y * BOARD_SIDE + this.state.startPos.x;
        const eI = endPos.y * BOARD_SIDE + endPos.x;
        const layout = this.state.layout;
        layout[eI] = layout[sI];
        layout[sI] = undefined;

        this.setState({
          legalMoves: [],
          startPos: undefined,
          layout: layout,
        });

        this.props.onTurnEnd(this.state.startPos, endPos);

        return this.fraction;
      }

      return undefined;
    }

    let pieces: JSX.Element[] = [];
    for (let i = 0; i < this.state.layout.length; i++) {
      const pieceData = this.state.layout[i];

      if (pieceData === undefined) continue;

      pieces.push(
        <Piece key={i}
          data={pieceData}
          index={i}
          isEnabled={pieceData.color === this.props.role}

          onStart={() => {
            if (this.fraction === undefined) return;

            const pos = fractionToPosition(this.fraction);
            const moves = getLegalMoves(this.state.layout, true, pos);
            if (moves.ok) {
              this.setState({
                legalMoves: moves.value,
                startPos: pos
              });
            }
          }}

          onEnd={onEnd}
        />
      );
    }

    let visuals: JSX.Element[] = [];
    if (this.state.startPos != undefined) {
      visuals = [
        ...this.state.legalMoves.map((move, i) =>
          <Dot key={i} position={move} onPressed={onEnd} />
        ),
        ...[<Highlight key={-1} position={this.state.startPos} />]
      ]
    }

    return (
      <Box sx={{ maxWidth: `700px`, maxHeight: `700px` }}>
        <Box ref={this.boxRef}
          onMouseMove={(e) => {
            const rect = this.boxRef.current?.getBoundingClientRect();
            if (rect === undefined) return;
            if (
              e.clientX < rect.left || e.clientX > rect.right ||
              e.clientY < rect.top || e.clientY > rect.bottom) {
              this.fraction = undefined;
            } else {
              this.fraction = {
                x: (e.clientX - rect.x) / rect.width,
                y: (e.clientY - rect.y) / rect.height,
              };
            }
          }}
          onMouseDown={(e) => {
            this.setState({
              legalMoves: [],
              startPos: undefined,
            });
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
          {visuals}
        </Box>
      </Box>
    );
  }
}

function fractionToPosition(fraction: Point) {
  return {
    x: Math.floor(fraction.x * BOARD_SIDE),
    y: Math.floor(fraction.y * BOARD_SIDE),
  };
}