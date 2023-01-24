import { err, ok, Result } from "shared/tools/result";
import { DrawReason, GameData, GameStatus, GameStatusCatagory, GameTurn, GameViewData, MoveError, Point, WinReason } from "shared/types/game";
import { PieceColor, PieceData, PieceType } from "shared/types/piece";
import Lodash from "lodash";
import { BoardLayout, PieceCount, PieceDataWithKey } from "shared/types/boardLayout";
import { comparePieces, getOppositeColor, pieceDataToRepChar } from "shared/tools/piece";
import { hasCausedRepetition } from "shared/tools/rep";

export const BOARD_SIDE = 8;
export const SQUARE_SIZE = 1 / BOARD_SIDE * 100;

export function startAndTurnsToBoardLayout(start: PieceType[], turns: GameTurn[]) {
  const layout: BoardLayout = new Array(BOARD_SIDE * BOARD_SIDE).fill(undefined);

  const pieceCrntIs = new Map<PieceType, number>(
    Object.values(PieceType).map(pieceType => [pieceType as PieceType, 0])
  );
  const backRankKeyIs = start.map(pieceType => {
    pieceCrntIs.set(pieceType, pieceCrntIs.get(pieceType)! + 1);
    return pieceCrntIs.get(pieceType)!;
  })

  for (let x = 0; x < BOARD_SIDE; x++) {
    layout[x] = getPiece({ type: start[x], color: PieceColor.White }, backRankKeyIs[x]);
    layout[BOARD_SIDE + x] = getPiece({ type: PieceType.Pawn, color: PieceColor.White }, x);
    layout[BOARD_SIDE * (BOARD_SIDE - 2) + x] = getPiece({ type: PieceType.Pawn, color: PieceColor.Black }, x);
    layout[BOARD_SIDE * (BOARD_SIDE - 1) + x] = getPiece({ type: start[x], color: PieceColor.Black }, backRankKeyIs[x]);;
  }

  for (const turn of turns) {
    const action = turn.action;
    const fromI = action % BOARD_SIDE ** 2;
    const toI = Math.floor(action / BOARD_SIDE ** 2);
    layout[toI] = layout[fromI];
    layout[fromI] = undefined;

    if (
      turn.promotionType !== null && layout[toI] !== undefined) {
      layout[toI]!.type = turn.promotionType;
    }
  }

  return layout;

  function getPiece(data: PieceData, i: number): PieceDataWithKey {
    return { ...data, key: `${pieceDataToRepChar(data)}${i}` }
  }
}

export function getLegalMoves(layout: BoardLayout, turnColor: PieceColor, square0: Point): Result<Point[], MoveError> {
  var moves: Point[] = [];

  const getValue = (square: Point) => {
    return layout[BOARD_SIDE * square.y + square.x];
  }

  const value0 = getValue(square0);

  if (value0 == undefined) {
    return err(MoveError.NoPiece);
  }
  if (turnColor != value0.color) {
    return err(MoveError.WrongColor);
  }

  const addLegalOptionMoves = (options: Point[]) => {
    for (let option of options) {
      const square1 = { x: square0.x + option.x, y: square0.y + option.y };
      if (!isOnBoard(square1)) continue;
      var value1 = getValue(square1);
      if (value1 == null || value1.color != value0.color) moves.push(square1);
    }
  }

  const addLegalDirMoves = (dirs: Point[]) => {
    for (let j = 0; j < dirs.length; j++) {
      for (let i = 1; ; i++) {
        const squareI = { x: square0.x + i * dirs[j].x, y: square0.y + i * dirs[j].y };
        if (!isOnBoard(squareI)) break;
        var valueI = getValue(squareI);
        if (valueI !== undefined && valueI.color === value0.color) break;
        moves.push(squareI);
        if (valueI != undefined) break;
      }
    }
  }

  var rookDirs: Point[] = [
    { x: 0, y: -1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  var bishopDirs: Point[] = [
    { x: -1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
  ];

  switch (value0.type) {
    case PieceType.King:
      addLegalOptionMoves([
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]);
      break;
    case PieceType.Queen:
      addLegalDirMoves([...rookDirs, ...bishopDirs]);
      break;
    case PieceType.Rook:
      addLegalDirMoves(rookDirs);
      break;
    case PieceType.Knight:
      addLegalOptionMoves([
        { x: -1, y: -2 },
        { x: 1, y: -2 },
        { x: -2, y: -1 },
        { x: 2, y: -1 },
        { x: -2, y: 1 },
        { x: 2, y: 1 },
        { x: -1, y: 2 },
        { x: 1, y: 2 },
      ]);
      break;
    case PieceType.Bishop:
      addLegalDirMoves(bishopDirs);
      break;
    case PieceType.Pawn:
      const isWhite = value0.color == PieceColor.White;
      const yDir = isWhite ? 1 : -1;
      var opCons: { op: Point, con: (value1: PieceData | undefined) => boolean }[] = [
        {
          op: { x: 0, y: 2 },
          con: value1 =>
            square0.y == (isWhite ? 1 : (BOARD_SIDE - 2)) &&
            getValue({ x: square0.x, y: (isWhite ? 2 : (BOARD_SIDE - 3)) }) === undefined &&
            value1 === undefined,
        },
        { op: { x: 0, y: 1 }, con: value1 => value1 === undefined },
        { op: { x: -1, y: 1 }, con: value1 => value1 !== undefined && value1.color !== value0.color },
        { op: { x: 1, y: 1 }, con: value1 => value1 !== undefined && value1.color != value0.color },
      ];
      for (var opCon of opCons) {
        var square1: Point = { x: square0.x + opCon.op.x, y: square0.y + opCon.op.y * yDir };
        if (!isOnBoard(square1)) continue;
        var value1 = getValue(square1);
        if (opCon.con(value1)) {
          moves.push(square1);
        }
      }
      break;
  }

  if (moves.length === 0) return err(MoveError.NoMoves);

  return ok(moves);
}

export function isKingCaptured(layout: BoardLayout, color: PieceColor): boolean {
  for (const square of layout) {
    if (square?.type === PieceType.King && square.color === color) {
      return false;
    }
  }

  return true;
}

function isInCheck(layout: BoardLayout, turnColor: PieceColor): boolean {
  const oppositeColor = getOppositeColor(turnColor);

  for (let i = 0; i < BOARD_SIDE ** 2; i++) {
    const value = layout[i];
    if (value !== undefined && value.color === oppositeColor) {

      const movesResult = getLegalMoves(layout, oppositeColor, indexToPoint(i));
      if (!movesResult.ok) continue;
      const moves = movesResult.value;

      for (const move of moves) {

        const moveValue = layout[pointToIndex(move)];
        if (moveValue === undefined) continue;

        if (comparePieces(moveValue, { type: PieceType.King, color: turnColor })) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isInCheckmate(layout: BoardLayout, turnColor: PieceColor): boolean {
  if (!isInCheck(layout, turnColor)) { return false; }

  for (let i = 0; i < BOARD_SIDE ** 2; i++) {
    const value = layout[i];
    if (value === undefined || value.color !== turnColor) continue;

    const movesResult = getLegalMoves(layout, turnColor, indexToPoint(i));
    if (!movesResult.ok) continue;

    const moves = movesResult.value;

    for (const move of moves) {
      if (isInCheck(step(layout, indexToPoint(i), move, null), turnColor)) continue;

      console.log(step(layout, indexToPoint(i), move, null));
      console.log(indexToPoint(i), move);
      return false;
    }
  }

  return true;
}

function isInStalemate(layout: BoardLayout, turnColor: PieceColor): boolean {
  if (isInCheck(layout, turnColor)) return false;

  for (let i = 0; i < layout.length; i++) {
    const crntValue = layout[i];
    if (crntValue === undefined || crntValue.color !== turnColor) continue;

    const movesResult = getLegalMoves(layout, turnColor, indexToPoint(i));
    if (movesResult.ok) {
      const moves = movesResult.value;
      for (const move of moves) {
        const newLayout = step(layout, indexToPoint(i), move, null);
        if (!isInCheck(newLayout, turnColor)) return false;
      }
    }
  }

  return true;
}

export function getGameStatus(layout: BoardLayout, turnColor: PieceColor, turns: GameTurn[], startRep: string): GameStatus {
  const oppositeColor = getOppositeColor(turnColor)
  
  if (isKingCaptured(layout, oppositeColor)) {
    return {
      catagory: GameStatusCatagory.Win,
      winColor: turnColor,
      reason: WinReason.KingCaptured,
    }
  }
  if (isInCheckmate(layout, oppositeColor)) {
    return {
      catagory: GameStatusCatagory.Win,
      winColor: turnColor,
      reason: WinReason.Checkmate,
    }
  }
  if (isInStalemate(layout, oppositeColor)) { //needs testing
    return {
      catagory: GameStatusCatagory.Win,
      winColor: turnColor,
      reason: WinReason.Stalemate,
    }
  }
  if (hasCausedRepetition(turns, startRep)) {
    return {
      catagory: GameStatusCatagory.Draw,
      reason: DrawReason.Repetition,
    }
  }

  return { catagory: GameStatusCatagory.Ongoing };
}

export function step(
  layout: BoardLayout,
  from: Point, to: Point,
  promotionType: PieceType | null
) {
  let newLayout = [...layout];
  const fromI = from.x + BOARD_SIDE * from.y;
  const toI = to.x + BOARD_SIDE * to.y;

  newLayout[toI] = newLayout[fromI];
  newLayout[fromI] = undefined;

  if (promotionType !== null && newLayout[toI] !== undefined) {
    newLayout[toI]!.type = promotionType;
  }

  return newLayout;
}

export function promote(layout: BoardLayout, to: Point, promotionType: PieceType) {
  let newLayout = [...layout];

  const toI = pointToIndex(to);

  if (newLayout[toI] !== undefined) {
    throw new Error('Square at promotion sqaure is undefined');
  }

  newLayout[toI]!.type = promotionType;

  return newLayout;
}

export function getPieceCounts(layout: BoardLayout, turnColor: PieceColor) {
  const piecesCounts: PieceCount[] = [
    { type: PieceType.Queen, count: 1 },
    { type: PieceType.Rook, count: 2 },
    { type: PieceType.Knight, count: 2 },
    { type: PieceType.Bishop, count: 2 },
  ];

  for (const square of layout) {
    if (square?.color !== turnColor) continue;

    const pieceCount = piecesCounts.find(x => x.type == square.type);
    if (pieceCount === undefined) continue;

    pieceCount.count--;
  }

  return piecesCounts;
}

export function isOnBoard(square: Point) {
  return (
    square.x >= 0 && square.x < BOARD_SIDE &&
    square.y >= 0 && square.y < BOARD_SIDE
  );
}

export function pointToIndex(point: Point) {
  return point.x + BOARD_SIDE * point.y;
}

export function indexToPoint(square: number): Point {
  return { x: square % BOARD_SIDE, y: Math.floor(square / BOARD_SIDE) };
}

export function generateStart() {
  const layout = Array<PieceType>(BOARD_SIDE);

  layout[Math.floor(Math.random() * 4) * 2] = PieceType.Bishop;
  layout[Math.floor(Math.random() * 4) * 2 + 1] = PieceType.Bishop;

  const pieceTypes = [
    PieceType.King,
    PieceType.Queen,
    PieceType.Knight,
    PieceType.Knight,
  ];

  for (let pieceI = 0; pieceI < pieceTypes.length; pieceI++) {
    let goal = Math.floor(Math.random() * (6 - pieceI));
    let steps = 0;
    for (let position = 0; position < BOARD_SIDE; position++) {
      if (layout[position] === undefined) {
        if (steps === goal) {
          layout[position] = pieceTypes[pieceI];
          break;
        }
        steps++;
      }
    }
  }

  for (let i = 0; i < BOARD_SIDE; i++) {
    if (layout[i] === undefined) {
      layout[i] = PieceType.Rook
    }
  }

  return layout;
}
