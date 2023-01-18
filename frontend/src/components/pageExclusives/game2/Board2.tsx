import { Box } from "@mui/material";
import Background from "frontend/src/components/pageExclusives/game/Board/Background";
import Piece from "frontend/src/components/pageExclusives/game/Board/Piece";
import { Dot, Highlight } from "frontend/src/components/pageExclusives/game/Board/Visuals";
import Stateful from "frontend/src/utils/tools/stateful";
import { useRef } from "react";
import { BOARD_SIDE } from "shared/globals";
import { getLegalMoves, getPieceCounts, pointToIndex } from "shared/tools/boardLayout";
import { BoardLayout, PieceDataWithKey } from "shared/types/boardLayout";
import { Point } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import Lodash from "lodash";
import { comparePoints } from "shared/tools/point";
import PromotionBanner from "frontend/src/components/pageExclusives/game/Board/PromotionBanner";

let mousePercentPos: Point | null = null;

export default function Board2(props: {
  layout: BoardLayout,
  turnColor: PieceColor,
  enabled: boolean,
  onMove: (from: Point, to: Point) => void,
  onPromotion: (to: Point, promotionType: PieceType) => void,
  onTurnEnd: (from: Point, to: Point, promotionType: PieceType | null) => void,
}) {
  const { layout, turnColor, enabled, onMove, onPromotion, onTurnEnd } = props;

  const boxRef = useRef<HTMLDivElement>(null);

  const from = new Stateful<Point | null>(null);
  const promotionTo = new Stateful<Point | null>(null);
  const legalMoves = new Stateful<Point[]>([]);
  const pieceSlide = new Stateful<boolean>(false);

  return (
    <Box sx={{ maxWidth: `700px`, maxHeight: `700px` }}>
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
  );

  function setMouseRelPos(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      mousePercentPos = null;
    } else {
      mousePercentPos = {
        x: (e.clientX - rect.x) / rect.width,
        y: (e.clientY - rect.y) / rect.height,
      };
    }
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
          index={data.index}
          isEnabled={enabled && data.color === turnColor}
          slide={pieceSlide.value}
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
      ...[<Highlight key={-1} position={from.value} />],
      ...legalMoves.value.map((legalMove, i) =>
        <Dot key={i}
          position={legalMove}
          onPressed={() => {
            move();
            pieceSlide.set(true);
          }}
        />
      ),
    ]
  }

  function getPromotionBanner(): JSX.Element {
    if (from.value === null || promotionTo.value === null) return <></>;

    const pieceCounts = getPieceCounts(layout, turnColor);

    if (!pieceCounts.some(pieceCount => pieceCount.count > 0)) {
      onTurnEnd(from.value, promotionTo.value, null);

      from.set(null);
      promotionTo.set(null);
      return <></>
    }

    return <PromotionBanner
      color={turnColor}
      pieceCounts={pieceCounts}
      onChoice={(type)=>{
        if (from.value === null || promotionTo.value === null) return;

        onPromotion(promotionTo.value, type);
        onTurnEnd(from.value, promotionTo.value, type);

        from.set(null);
        promotionTo.set(null);
      }}
    />
  }

  function onStart() {
    if (mousePercentPos === null) return;

    const mouseSquarePos: Point = percentPosToSquarePos(mousePercentPos);
    const moves = getLegalMoves(layout, turnColor, mouseSquarePos);
    if (moves.ok) {
      from.set(mouseSquarePos);
      legalMoves.set(moves.value);
    }
  }

  function move() {
    if (from.value === null || mousePercentPos === null) return;

    const to = percentPosToSquarePos(mousePercentPos);
    if (legalMoves.value.some(legalMove => comparePoints(legalMove, to))) return;

    onMove(from.value, to);

    if (!isPromotion(to)) {
      onTurnEnd(from.value, to, null);
    } else {
      promotionTo.set(to);
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

  function isPromotion(to: Point) {
    const toI = pointToIndex(to);

    return layout[toI]?.type === PieceType.Pawn &&
      (
        (turnColor === PieceColor.White && toI >= BOARD_SIDE ** 2 - BOARD_SIDE) ||
        (turnColor === PieceColor.Black && toI < BOARD_SIDE)
      );
  }
}