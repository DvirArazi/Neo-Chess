import type { GameState, MoveInput, Piece, Square } from "./types";

const BOARD_SIZE = 8;

type Offset = {
  x: number;
  y: number;
};

export type BoardGameOutcome =
  | {
    result: "win";
    winner: Piece["color"];
    reason: "checkmate";
  }
  | {
    result: "draw";
    reason: "stalemate";
  };

function isInBounds(tile: Square): boolean {
  return (
    tile.x >= 0 && tile.x < BOARD_SIZE &&
    tile.y >= 0 && tile.y < BOARD_SIZE
  );
}

function pointsEqual(a: Square, b: Square): boolean {
  return a.x === b.x && a.y === b.y;
}

function addSlidingMoves(
  from: Square,
  state: GameState,
  piece: Piece,
  directions: Offset[],
  moves: Square[],
): void {
  for (const direction of directions) {
    let x = from.x + direction.x;
    let y = from.y + direction.y;

    while (isInBounds({ x, y })) {
      const target = state.board[y][x];
      if (!target) {
        moves.push({ x, y });
      } else {
        if (target.color !== piece.color) {
          moves.push({ x, y });
        }
        break;
      }

      x += direction.x;
      y += direction.y;
    }
  }
}

function findKing(state: GameState, color: Piece["color"]): Square | null {
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const piece = state.board[y][x];
      if (piece?.type === "king" && piece.color === color) {
        return { x, y };
      }
    }
  }
  return null;
}

function isTileAttackedBy(
  state: GameState,
  tile: Square,
  attackerColor: Piece["color"],
): boolean {
  const pawnSourceRankOffset = attackerColor === "white" ? 1 : -1;
  const pawnSources = [
    { x: tile.x - 1, y: tile.y + pawnSourceRankOffset },
    { x: tile.x + 1, y: tile.y + pawnSourceRankOffset },
  ];
  for (const source of pawnSources) {
    if (!isInBounds(source)) continue;
    const piece = state.board[source.y][source.x];
    if (piece?.type === "pawn" && piece.color === attackerColor) return true;
  }

  const knightOffsets = [
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: -1 },
    { x: 1, y: -2 },
    { x: -1, y: -2 },
    { x: -2, y: -1 },
    { x: -2, y: 1 },
    { x: -1, y: 2 },
  ];
  for (const offset of knightOffsets) {
    const source = { x: tile.x + offset.x, y: tile.y + offset.y };
    if (!isInBounds(source)) continue;
    const piece = state.board[source.y][source.x];
    if (piece?.type === "knight" && piece.color === attackerColor) return true;
  }

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const source = { x: tile.x + dx, y: tile.y + dy };
      if (!isInBounds(source)) continue;
      const piece = state.board[source.y][source.x];
      if (piece?.type === "king" && piece.color === attackerColor) return true;
    }
  }

  const bishopDirections = [
    { x: 1, y: 1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: -1, y: -1 },
  ];
  for (const direction of bishopDirections) {
    let x = tile.x + direction.x;
    let y = tile.y + direction.y;
    while (isInBounds({ x, y })) {
      const piece = state.board[y][x];
      if (!piece) {
        x += direction.x;
        y += direction.y;
        continue;
      }
      if (
        piece.color === attackerColor &&
        (piece.type === "bishop" || piece.type === "queen")
      ) {
        return true;
      }
      break;
    }
  }

  const rookDirections = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  for (const direction of rookDirections) {
    let x = tile.x + direction.x;
    let y = tile.y + direction.y;
    while (isInBounds({ x, y })) {
      const piece = state.board[y][x];
      if (!piece) {
        x += direction.x;
        y += direction.y;
        continue;
      }
      if (
        piece.color === attackerColor &&
        (piece.type === "rook" || piece.type === "queen")
      ) {
        return true;
      }
      break;
    }
  }

  return false;
}

function isKingInCheck(state: GameState, color: Piece["color"]): boolean {
  const kingTile = findKing(state, color);
  if (!kingTile) return false;

  const attackerColor = color === "white" ? "black" : "white";
  return isTileAttackedBy(state, kingTile, attackerColor);
}

export function getPseudoLegalMoves(from: Square, state: GameState): Square[] {
  if (!isInBounds(from)) return [];

  const piece = state.board[from.y]?.[from.x];
  if (!piece) return [];

  const moves: Square[] = [];

  switch (piece.type) {
    case "pawn": {
      const forward = piece.color === "white" ? -1 : 1;
      const startRank = piece.color === "white" ? 6 : 1;

      const oneStep = { x: from.x, y: from.y + forward };
      if (isInBounds(oneStep) && !state.board[oneStep.y][oneStep.x]) {
        moves.push(oneStep);

        const twoStep = { x: from.x, y: from.y + 2 * forward };
        if (
          from.y === startRank &&
          isInBounds(twoStep) &&
          !state.board[twoStep.y][twoStep.x]
        ) {
          moves.push(twoStep);
        }
      }

      const captures = [
        { x: from.x - 1, y: from.y + forward },
        { x: from.x + 1, y: from.y + forward },
      ];
      for (const capture of captures) {
        if (!isInBounds(capture)) continue;

        const target = state.board[capture.y][capture.x];
        if (target && target.color !== piece.color) {
          moves.push(capture);
          continue;
        }

        if (state.enPassantTarget && pointsEqual(capture, state.enPassantTarget)) {
          moves.push(capture);
        }
      }
      break;
    }
    case "knight": {
      const offsets = [
        { x: 1, y: 2 },
        { x: 2, y: 1 },
        { x: 2, y: -1 },
        { x: 1, y: -2 },
        { x: -1, y: -2 },
        { x: -2, y: -1 },
        { x: -2, y: 1 },
        { x: -1, y: 2 },
      ];

      for (const offset of offsets) {
        const candidate = { x: from.x + offset.x, y: from.y + offset.y };
        if (!isInBounds(candidate)) continue;

        const target = state.board[candidate.y][candidate.x];
        if (!target || target.color !== piece.color) {
          moves.push(candidate);
        }
      }
      break;
    }
    case "bishop":
      addSlidingMoves(
        from,
        state,
        piece,
        [
          { x: 1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: -1, y: -1 },
        ],
        moves,
      );
      break;
    case "rook":
      addSlidingMoves(
        from,
        state,
        piece,
        [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ],
        moves,
      );
      break;
    case "queen":
      addSlidingMoves(
        from,
        state,
        piece,
        [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
          { x: 1, y: 1 },
          { x: 1, y: -1 },
          { x: -1, y: 1 },
          { x: -1, y: -1 },
        ],
        moves,
      );
      break;
    case "king":
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const candidate = { x: from.x + dx, y: from.y + dy };
          if (!isInBounds(candidate)) continue;

          const target = state.board[candidate.y][candidate.x];
          if (!target || target.color !== piece.color) {
            moves.push(candidate);
          }
        }
      }
      break;
  }

  return moves;
}

export function applyMove(state: GameState, move: MoveInput): GameState {
  const { from, to } = move;
  const movingPiece = state.board[from.y]?.[from.x];
  if (!movingPiece) return state;

  const nextBoard = state.board.map((row) => [...row]);
  const destinationPiece = nextBoard[to.y][to.x];

  if (
    movingPiece.type === "pawn" &&
    from.x !== to.x &&
    !destinationPiece
  ) {
    const capturedPawnY = movingPiece.color === "white" ? to.y + 1 : to.y - 1;
    if (capturedPawnY >= 0 && capturedPawnY < BOARD_SIZE) {
      nextBoard[capturedPawnY][to.x] = null;
    }
  }

  nextBoard[from.y][from.x] = null;
  nextBoard[to.y][to.x] = movingPiece;

  const nextEnPassantTarget = (
    movingPiece.type === "pawn" && Math.abs(to.y - from.y) === 2
  )
    ? { x: from.x, y: (from.y + to.y) / 2 }
    : null;

  return {
    board: nextBoard,
    turn: movingPiece.color === "white" ? "black" : "white",
    enPassantTarget: nextEnPassantTarget,
  };
}

export function getLegalMoves(from: Square, state: GameState): Square[] {
  if (!isInBounds(from)) return [];

  const movingPiece = state.board[from.y]?.[from.x];
  if (!movingPiece) return [];
  if (movingPiece.color !== state.turn) return [];

  const pseudoLegalMoves = getPseudoLegalMoves(from, state);

  return pseudoLegalMoves.filter((to) => {
    const nextState = applyMove(state, { from, to });
    return !isKingInCheck(nextState, movingPiece.color);
  });
}

export function getBoardGameOutcome(
  state: GameState,
): BoardGameOutcome | null {
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const piece = state.board[y][x];
      if (!piece || piece.color !== state.turn) continue;

      if (getLegalMoves({ x, y }, state).length > 0) {
        return null;
      }
    }
  }

  if (isKingInCheck(state, state.turn)) {
    return {
      result: "win",
      winner: state.turn === "white" ? "black" : "white",
      reason: "checkmate",
    };
  }

  return {
    result: "draw",
    reason: "stalemate",
  };
}
