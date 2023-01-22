import { Box } from "@mui/material";
import Background from "frontend/src/components/pageExclusives/game/Board/Background";
import Piece from "frontend/src/components/pageExclusives/game/Board/Piece";
import { Dot, Highlight } from "frontend/src/components/pageExclusives/game/Board/Visuals";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { BOARD_SIDE, getLegalMoves, getPieceCounts, pointToIndex } from "shared/tools/boardLayout";
import { BoardLayout, PieceCount, PieceDataWithKey } from "shared/types/boardLayout";
import { Point } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import { comparePoints } from "shared/tools/point";
import PromotionBanner from "frontend/src/components/pageExclusives/game/Board/PromotionBanner";

export default function Board(props: {
  layout: BoardLayout,
  turnColor: PieceColor,
  enabled: boolean,
  isFlipped: boolean,
  flipPieces: boolean,
  onMove: (from: Point, to: Point, layout: BoardLayout) => void,
  onPromotion: (promotionType: PieceType) => void,
  onTurnEnd: () => void,
}) {
  const {
    layout,
    turnColor,
    enabled,
    isFlipped,
    flipPieces,
    onMove,
    onPromotion,
    onTurnEnd
  } = props;

  const boxRef = useRef<HTMLDivElement>(null);
  const mousePercentPos = useRef<Point | null>(null);

  const from = new Stateful<Point | null>(null);
  const promotionTo = new Stateful<Point | null>(null);
  const promotionPieceCounts = new Stateful<PieceCount[]>([]);
  const legalMoves = new Stateful<Point[]>([]);
  const pieceSlide = new Stateful<boolean>(true);

  return (
    <Box sx={{
      display: `flex`,
      flexDirection: `row`,
      justifyContent: `center`,
    }}>
      <Box sx={{
        flex: `1`,
        position: `absoulte`,
        maxWidth: `450px`,
        maxHeight: `450px`,
      }}>
        <Box ref={boxRef}
          onMouseMove={setMouseRelPos}
          onMouseDown={(e) => {
            from.set(null);
            legalMoves.set([]);
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
          {getPieces()}
          {getVisuals()}
          {getPromotionBanner()}
        </Box>
      </Box>
    </Box>
  );

  function setMouseRelPos(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect === undefined) return;

    const getPos = () => {
      const pos: Point = {
        x: (e.clientX - rect.x) / rect.width,
        y: (e.clientY - rect.y) / rect.height,
      };

      return isFlipped ? pos : {
        x: 1 - pos.x,
        y: 1 - pos.y
      } ;
    }

    mousePercentPos.current = (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) ? null : getPos()
  };

  function getPieces(): JSX.Element[] {
    return layout
      .map((data, i) => data !== undefined ? { ...data, ...{ index: i } } : undefined)
      .filter(data => data !== undefined)
      .sort((a, b) => a!.key > b!.key ? 1 : -1)
      .map(dataO => {
        const data = dataO!;
        return <Piece key={data.key}
          data={data}
          index={getIndex(data.index)}
          isEnabled={enabled && data.color === turnColor}
          slide={pieceSlide.value}
          isFlipped={flipPieces}
          onStart={onStart}
          onEnd={() => {
            move();
            pieceSlide.set(false);
          }}
        />
      });
  }

  function getVisuals(): JSX.Element[] {
    if (from.value === null) return [];

    return [
      ...[<Highlight key={-1} position={getPoint(from.value)} />],
      ...legalMoves.value.map((legalMove, i) =>
        <Dot key={i}
          position={getPoint(legalMove)}
          onPressed={() => {
            move();
            pieceSlide.set(true);
          }}
        />
      ),
    ]
  }

  function getPromotionBanner(): JSX.Element {
    if (promotionTo.value === null) {
      return <></>;
    }

    return <PromotionBanner
      color={turnColor}
      pieceCounts={promotionPieceCounts.value}
      onChoice={(type) => {
        onPromotion(type);
        onTurnEnd();

        promotionTo.set(null);
      }}
    />;
  }

  function onStart() {
    if (mousePercentPos.current === null) return;

    const mouseSquarePos: Point = percentPosToSquarePos(mousePercentPos.current);
    const moves = getLegalMoves(layout, turnColor, mouseSquarePos);
    if (moves.ok) {
      from.set(mouseSquarePos);
      legalMoves.set(moves.value);
    }
  }

  function move() {
    if (from.value === null || mousePercentPos.current === null) return;

    const newTo = percentPosToSquarePos(mousePercentPos.current);
    if (!legalMoves.value.some(legalMove => comparePoints(legalMove, newTo))) return;

    const fromI = pointToIndex(from.value);
    const toI = pointToIndex(newTo);
    const newLayout = [...layout]; //if works, remove wrap and try again
    newLayout[toI] = newLayout[fromI];
    newLayout[fromI] = undefined;

    onMove(from.value, newTo, newLayout);

    let pieceCounts: PieceCount[];
    if (
      isPromotion(newLayout, newTo) &&
      (pieceCounts = getPieceCounts(layout, turnColor))
        .some(pieceCount => pieceCount.count > 0)
    ) {
      promotionTo.set(newTo);
      promotionPieceCounts.set(pieceCounts);
    } else {
      onTurnEnd();
    }

    from.set(null);
    legalMoves.set([]);
  }

  function percentPosToSquarePos(percentPos: Point): Point {
    return {
      x: Math.floor(percentPos.x * BOARD_SIDE),
      y: Math.floor(percentPos.y * BOARD_SIDE),
    }
  }

  function isPromotion(layout: BoardLayout, to: Point) {
    const toI = pointToIndex(to);

    return layout[toI]?.type === PieceType.Pawn &&
      (
        (turnColor === PieceColor.White && toI >= BOARD_SIDE ** 2 - BOARD_SIDE) ||
        (turnColor === PieceColor.Black && toI < BOARD_SIDE)
      );
  }

  function getIndex(index: number) {
    return isFlipped ? index : BOARD_SIDE ** 2 - 1 - index; 
  }

  function getPoint(point: Point) {
    return isFlipped ? point : {
      x: BOARD_SIDE - 1 - point.x,
      y: BOARD_SIDE - 1 - point.y,
    };
  }
}