import { Box } from "@mui/material";
import BoardBackground from "frontend/src/components/pageExclusives/game/BoardBackground";
import Piece from "frontend/src/components/pageExclusives/game/Board/Piece";
import { Dot, ChosenHighlight, PreviousHighlight } from "frontend/src/components/pageExclusives/game/Board/Visuals";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
import { BOARD_SIDE, getLegalMoves, getCapturedCountsWithoutPawns, pointToIndex, indexToPoint } from "shared/tools/boardLayout";
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
  prevMove: {from: Point, to: Point} | null,
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
    prevMove,
    onMove,
    onPromotion,
    onTurnEnd
  } = props;

  const boxRef = useRef<HTMLDivElement>(null);
  // const mousePercentPos = useRef<Point | null>(null);

  const from = new Stateful<Point | null>(null);
  const promotionTo = new Stateful<Point | null>(null);
  const promotionPieceCounts = new Stateful<PieceCount[]>([]);
  const legalMoves = new Stateful<Point[]>([]);
  const pieceSlide = new Stateful<boolean>(true);

  useEffect(
    () => { if (!pieceSlide.value) pieceSlide.set(true) },
    [turnColor]
  );
  useEffect(() => {
    const handler = () => {
      from.set(null);
      legalMoves.set([]);
    }
    window.addEventListener("mousedown", handler)
    return () => {
      window.removeEventListener("mousedown", handler, true);
    }
  }, []);

  return (
    <Box sx={{
      display: `flex`,
      flexDirection: `row`,
      justifyContent: `center`,
    }}>
      <Box sx={{
        flex: `1`,
      }}>
        <Box ref={boxRef}
          sx={{
            position: `relative`,
            width: `100%`,
            paddingBottom: `100%`,
            boxSizing: `border-box`,
            overflow: `hidden`,
          }}
        >
          <BoardBackground />
          {getPieces()}
          {getVisuals()}
          {getPreviousHighlights()}
          {getPromotionBanner()}
        </Box>
      </Box>
    </Box>
  );

  function globalToRelPos(globalPos: Point): Point | null {
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect === undefined) return null;

    const pos: Point = {
      x: (globalPos.x - rect.x) / rect.width,
      y: (globalPos.y - rect.y) / rect.height,
    };

    return isFlipped ? pos : {
      x: 1 - pos.x,
      y: 1 - pos.y
    };
  };

  function getPieces(): (JSX.Element | null)[] {
    const pieces = new Array<JSX.Element | null>(32).fill(null);

    for (let i = 0; i < layout.length; i++) {
      const piece = layout[i];
      if (piece === null) continue;
      pieces[piece.key] = <Piece key={piece.key}
        data={piece}
        index={getIndex(i)}
        isEnabled={enabled && piece.color === turnColor}
        slide={pieceSlide.value}
        isFlipped={flipPieces}
        onStart={handleStart}
        onEnd={handleEnd}
      />
    }

    return pieces;

    function handleStart(globalPos: Point) {
      const relPos = globalToRelPos(globalPos);
      if (relPos === null) return;
      onStart(relPos);
    }

    function handleEnd(globalPos: Point) {
      const relPos = globalToRelPos(globalPos);
      if (relPos === null) return;
      move(relPos);
      pieceSlide.set(false);
    }
  }

  function getVisuals(): JSX.Element[] {
    if (from.value === null) return [];

    return [
      ...[<ChosenHighlight key={-1} position={getPoint(from.value)} />],
      ...legalMoves.value.map((legalMove, i) =>
        <Dot key={i}
          position={getPoint(legalMove)}
          onPressed={(globalPos) => {
            const relPos = globalToRelPos(globalPos);
            if (relPos === null) return;
            move(relPos);
            pieceSlide.set(true);
          }}
        />
      ),
    ]
  }

  function getPreviousHighlights(): JSX.Element {
    if (prevMove === null) return <></>;

    return <>
      <PreviousHighlight position={getPoint(prevMove.from)} />
      <PreviousHighlight position={getPoint(prevMove.to)} />
    </>;
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

  function onStart(relPos: Point) {
    const mouseSquarePos: Point = percentPosToSquarePos(relPos);
    const moves = getLegalMoves(layout, turnColor, mouseSquarePos);
    if (moves.ok) {
      from.set(mouseSquarePos);
      legalMoves.set(moves.value);
    } else {
      from.set(null);
      legalMoves.set([]);
    }
  }

  function move(relPos: Point) {
    if (from.value === null) return;

    const newTo = percentPosToSquarePos(relPos);
    if (!legalMoves.value.some(legalMove => comparePoints(legalMove, newTo))) return;

    const fromI = pointToIndex(from.value);
    const toI = pointToIndex(newTo);
    const newLayout = [...layout]; //if works, remove wrap and try again
    newLayout[toI] = newLayout[fromI];
    newLayout[fromI] = null;

    onMove(from.value, newTo, newLayout);

    let pieceCounts: PieceCount[];
    if (
      isPromotion(newLayout, newTo) &&
      (pieceCounts = getCapturedCountsWithoutPawns(layout, turnColor))
        .some(pieceCount => pieceCount.count > 0)
    ) {
      promotionTo.set(newTo);
      promotionPieceCounts.set(pieceCounts);
    } else {
      onTurnEnd();
    }

    from.set(null);
    legalMoves.set([]);
    pieceSlide.set(true);
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