import { Box } from "@mui/material";
import Background from "frontend/src/components/pageExclusives/game/Board/Background";
import { Dot, Highlight } from "frontend/src/components/pageExclusives/game/Board/Visuals";
import Piece from "frontend/src/components/pageExclusives/game/Board/Piece";
import { BOARD_SIDE } from "shared/globals";
import { getLegalMoves, IndexToPoint, pointToIndex } from "shared/tools/boardLayout";
import { Point } from "shared/types/game";
import Lodash from "lodash";
import React from "react";
import PromotionBanner from "frontend/src/components/pageExclusives/game/Board/PromotionBanner";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";
import { comparePieces, getOppositeColor } from "shared/tools/piece";
import { BoardLayout } from "shared/types/boardLayout";

export const SQUARE_SIZE = 1 / BOARD_SIDE * 100;

type Props = {
  layout: BoardLayout,
  turnColor: PieceColor,
  enabled: boolean,
  onTurnEnd: (start: Point, endPos: Point, promotion: PieceType | null) => void,
}
type State = {
  layout: BoardLayout,
  turnColor: PieceColor,
  legalMoves: Point[],
  from: Point | undefined,
  promotionSquare: number | undefined,
  pieceSlide: boolean,
}
export default class Board extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      layout: props.layout,
      turnColor: props.turnColor,
      legalMoves: [],
      from: undefined,
      promotionSquare: undefined,
      pieceSlide: true,
    };
  }

  private boxRef = React.createRef<HTMLDivElement>();
  private fraction: Point | undefined = undefined;

  public update(layout: BoardLayout, turnColor: PieceColor) {
    this.setState({
      layout: layout,
      turnColor: turnColor,
      pieceSlide: true,
    });
  }

  render() {
    let pieces: JSX.Element[] = [];
    const piecesDatas = this.state.layout
      .map((data, i) => data !== undefined ? { ...data, ...{ index: i } } : undefined)
      .filter(data => data !== undefined)
      .sort((a, b) => a!.key > b!.key ? 1 : -1)
      ;
    for (const pieceData of piecesDatas) {
      if (pieceData === undefined) continue;

      pieces.push(
        <Piece key={pieceData.key}
          data={pieceData}
          index={pieceData.index}
          isEnabled={this.props.enabled && pieceData.color === this.state.turnColor}
          slide={this.state.pieceSlide}
          onStart={() => {
            if (this.fraction === undefined) return;

            const pos = fractionToPosition(this.fraction);
            const moves = getLegalMoves(this.state.layout, this.state.turnColor, pos);
            if (moves.ok) {
              this.setState({
                legalMoves: moves.value,
                from: pos
              });
            }
          }}
          onEnd={() => {
            this.onEnd();
            this.setState({ pieceSlide: false })
          }}
        />
      );
    }

    let visuals: JSX.Element[] = [];
    if (this.state.from != undefined) {
      visuals = [
        ...this.state.legalMoves.map((move, i) =>
          <Dot key={i}
            position={move}
            onPressed={() => {
              this.onEnd();
              this.setState({ pieceSlide: true })
            }}
          />
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
              e.clientY < rect.top || e.clientY > rect.bottom
            ) {
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
    if (this.fraction === undefined) return undefined;

    const to = fractionToPosition(this.fraction);

    if (
      this.state.from === undefined ||
      !Lodash.some(this.state.legalMoves, to)
    ) return undefined;

    const fromI = pointToIndex(this.state.from);
    const toI = pointToIndex(to);
    const layout = this.state.layout;
    layout[toI] = layout[fromI];
    layout[fromI] = undefined;

    this.setState({
      legalMoves: [],
      layout: layout,
    });

    if (
      layout[toI]?.type === PieceType.Pawn &&
      (
        (
          this.state.turnColor === PieceColor.White &&
          toI >= BOARD_SIDE ** 2 - BOARD_SIDE
        ) ||
        (
          this.state.turnColor === PieceColor.Black &&
          toI < BOARD_SIDE
        )
      )
    ) {
      console.log('delete 0');
      this.setState({
        promotionSquare: toI,
      });
    } else {
      this.setState({
        from: undefined,
        turnColor: getOppositeColor(this.state.turnColor),
      });
      this.props.onTurnEnd(this.state.from, to, null);
    }
  }

  private generatePromotionBanner = () => {
    console.log('delete 1');

    if (this.state.promotionSquare === undefined) return <></>;

    console.log('delete 2');

    const piecesCounts = [1, 2, 2, 2];
    for (const square of this.state.layout) {
      if (square?.color !== this.state.turnColor) continue;

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

    console.log(piecesCounts);
    if (!piecesCounts.some(count => count > 0)) {
      console.log('delete 3');
      this.endPromotion();
      return <></>
    };

    return (
      <PromotionBanner
        color={this.state.turnColor}
        piecesCounts={piecesCounts}
        onChoice={(type) => {
          const layout = this.state.layout;
          layout[this.state.promotionSquare!]!.type = type;

          this.setState({
            layout: layout,
          });

          this.endPromotion();
        }}
      />
    );
  }

  private endPromotion() {
    this.setState({
      from: undefined,
      promotionSquare: undefined,
      turnColor: getOppositeColor(this.state.turnColor),
    });

    console.log(this.state.from, this.state.promotionSquare);
    this.props.onTurnEnd(this.state.from!, IndexToPoint(this.state.promotionSquare!), null);
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
    return comparePieces(data, other);
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

  throw new Error(`PieceData provided does not correlate to any icon name: ${data.type}, ${data.color}`);
}