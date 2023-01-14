import { Box } from "@mui/material";
import Background from "frontend/src/components/pageExclusives/game/GameContainer/Board/Background";
import { Dot, Highlight } from "frontend/src/components/pageExclusives/game/GameContainer/Board/Visuals";
import Piece from "frontend/src/components/pageExclusives/game/GameContainer/Board/Piece";
import Stateful from "frontend/src/utils/stateful";
import { BoardLayout } from "frontend/src/utils/types";
import { useRef } from "react";
import { BOARD_SIDE } from "shared/globals";
import { getLegalMoves, pointToIndex } from "shared/tools/boardLayout";
import { EGameRole, GameRole, MoveError, Point } from "shared/types/gameTypes";
import Lodash from "lodash";
import React from "react";
import PromotionBanner from "frontend/src/components/pageExclusives/game/GameContainer/Board/PromotionBanner";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";

export const SQUARE_SIZE = 1 / BOARD_SIDE * 100;

type Props = {
  layout: BoardLayout,
  isWhiteTurn: boolean,
  role: GameRole,
  onTurnEnd: (start: Point, endPos: Point) => void,
}
type State = {
  legalMoves: Point[],
  from: Point | undefined,
  to: Point | undefined,
  layout: BoardLayout,
  isWhiteTurn: boolean,
  promotionSquare: number | undefined,
}
export default class Board extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      legalMoves: [],
      from: undefined,
      to: undefined,
      layout: props.layout,
      isWhiteTurn: props.isWhiteTurn,
      promotionSquare: undefined,
    };
  }

  private boxRef = React.createRef<HTMLDivElement>();
  private fraction: Point | undefined = undefined;

  public update(layout: BoardLayout, isWhiteTurn: boolean) {
    this.setState({
      layout: layout,
      isWhiteTurn: isWhiteTurn,
    });
  }

  render() {
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
            const moves = getLegalMoves(this.state.layout, this.state.isWhiteTurn, pos);
            if (moves.ok) {
              this.setState({
                legalMoves: moves.value,
                from: pos
              });
            }
          }}

          onEnd={this.onEnd}
        />
      );
    }

    let visuals: JSX.Element[] = [];
    if (this.state.from != undefined) {
      visuals = [
        ...this.state.legalMoves.map((move, i) =>
          <Dot key={i} position={move} onPressed={this.onEnd} />
        ),
        ...[<Highlight key={-1} position={this.state.from} />]
      ]
    }

    let promotionBanner = this.generatePromotionBanner();

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
              from: undefined,
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
          {promotionBanner}
        </Box>
      </Box>
    );
  }

  private onEnd = () => {
    console.log(this.boxRef);
    if (this.fraction === undefined) return undefined;

    const to = fractionToPosition(this.fraction);

    if (
      this.state.from !== undefined &&
      Lodash.some(this.state.legalMoves, to)
    ) {
      const fromI = pointToIndex(this.state.from);
      const toI = pointToIndex(to);
      const layout = this.state.layout;
      layout[toI] = layout[fromI];

      layout[fromI] = undefined;

      this.setState({
        legalMoves: [],
        layout: layout,
        isWhiteTurn: !this.state.isWhiteTurn,
      });

      if (
        (
          (
            this.props.role === PieceColor.White &&
            toI >= BOARD_SIDE ** 2 - BOARD_SIDE - 1
          ) ||
          (
            this.props.role === PieceColor.Black &&
            toI < BOARD_SIDE
          )
        ) &&
        layout[toI]?.type === PieceType.Pawn
      ) {
        this.setState({
          promotionSquare: toI,
          to: to,
        });
      } else {
        this.setState({
          from: undefined,
          to: undefined,
        });
        this.props.onTurnEnd(this.state.from, to);
      }

      return this.fraction;
    }

    return undefined;
  }

  private generatePromotionBanner = () => {
    if (
      this.state.promotionSquare === undefined ||
      this.props.role === EGameRole.Viewer
    ) {
      return <></>;
    }

    const piecesCounts = [1, 2, 2, 2];
    for (const square of this.state.layout) {
      if (square?.color !== this.props.role) continue;

      switch (square?.type) {
        case PieceType.Queen:
          piecesCounts[0]--;
          break;
        case PieceType.Rook:
          piecesCounts[1]--;
          break;
        case PieceType.Knight:
          piecesCounts[2]--;
          break;
        case PieceType.Bishop:
          piecesCounts[3]--;
          break;
      }
    }

    return (
      <PromotionBanner
        color={this.props.role}
        piecesCounts={piecesCounts}
        onChoice={(type) => {
          const layout = this.state.layout;
          layout[pointToIndex(this.state.to!)] = {
            type: type,
            color: this.props.role as PieceColor
          };

          this.setState({
            layout: layout,
            from: undefined,
            to: undefined,
            promotionSquare: undefined,
          });

          this.props.onTurnEnd(this.state.from!, this.state.to!);
        }}
      />
    );
  }
}

function fractionToPosition(fraction: Point) {
  return {
    x: Math.floor(fraction.x * BOARD_SIDE),
    y: Math.floor(fraction.y * BOARD_SIDE),
  };
}

export function pieceDataToIconName(data: PieceData): string {
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