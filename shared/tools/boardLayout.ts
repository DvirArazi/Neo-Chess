import { BoardLayout } from "frontend/src/utils/types";
import { BOARD_SIDE } from "shared/globals";
import { err, ok, Result } from "shared/tools/result";
import { MoveError, Point } from "shared/types/gameTypes";
import { PieceColor, PieceData, PieceType } from "shared/types/pieceTypes";

export function getLegalMoves(layout: BoardLayout, isWhiteTurn: boolean, square0: Point): Result<Point[], MoveError> {
  var moves: Point[] = [];

  const getValue = (square: Point) => {
    return layout[BOARD_SIDE * square.y + square.x];
  }

  const value0 = getValue(square0);

  if (value0 == undefined) {
    return err(MoveError.NoPiece);
  }
  if (isWhiteTurn != (value0.color == PieceColor.White)) {
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
      const yDir = isWhite ? -1 : 1;
      var opCons: { op: Point, con: (value1: PieceData | undefined) => boolean }[] = [
        {
          op: { x: 0, y: 2 },
          con: (value1) =>
            square0.y == (isWhite ? BOARD_SIDE - 2 : 1) &&
            getValue({ x: square0.x, y: (isWhite ? BOARD_SIDE - 3 : 2) }) === undefined &&
            value1 === undefined,
        },
        { op: { x: 0, y: 1 }, con: value1 => value1 === undefined },
        { op: { x: -1, y: -1 }, con: value1 => value1 !== undefined && value1.color !== value0.color },
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

function isOnBoard(square: Point) {
  return (
    square.x >= 0 && square.x < BOARD_SIDE &&
    square.y >= 0 && square.y < BOARD_SIDE
  );
}