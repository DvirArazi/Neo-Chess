import {
  type PointerEvent,
  type PointerEventHandler,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { getPieceImages, type PieceImages } from "./pieceAssets";
import type { MoveInput, Square } from "../types";
import type { BoardState } from "./types";
import { BOARD_SIZE } from "./setup";
import { getLegalMoves } from "../../../shared/chess/moveGeneration";

type CanvasPoint = {
  x: number;
  y: number;
};

type InteractionState = {
  turn: BoardState["turn"];
  selectedFrom: Square | null;
  legalMoves: Square[];
  dragPointerPos: CanvasPoint | null;
};

const EMPTY_SQUARES: Square[] = [];

function squaresEqual(a: Square, b: Square): boolean {
  return a.x === b.x && a.y === b.y;
}

function hasMove(moves: Square[], target: Square): boolean {
  return moves.some((move) => squaresEqual(move, target));
}

function toBoardPointerData(
  e: PointerEvent<HTMLCanvasElement>,
): { pointerPos: CanvasPoint; tileIndex: Square } {
  const rect = e.currentTarget.getBoundingClientRect();
  const tileSize = rect.width / BOARD_SIZE;
  const pointerPos = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  const tileIndex = {
    x: Math.min(
      BOARD_SIZE - 1,
      Math.max(0, Math.floor(pointerPos.x / tileSize)),
    ),
    y: Math.min(
      BOARD_SIZE - 1,
      Math.max(0, Math.floor(pointerPos.y / tileSize)),
    ),
  };
  return { pointerPos, tileIndex };
}

function drawBoard(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  boardState: BoardState,
  pieceImages: PieceImages,
  prevMove: MoveInput | null,
  selectedFrom: Square | null,
  dragPointerPos: CanvasPoint | null,
  circles: Square[],
) {
  const rect = canvas.getBoundingClientRect();
  const cssSize = rect.width;

  const dpr = window.devicePixelRatio || 1;
  const pixelSize = Math.round(cssSize * dpr);

  canvas.width = pixelSize;
  canvas.height = pixelSize;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const tileSize = cssSize / BOARD_SIZE;
  const draggedFrom = dragPointerPos ? selectedFrom : null;
  const floatingPiece = draggedFrom
    ? boardState.board[draggedFrom.y]?.[draggedFrom.x] ?? null
    : null;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  for (let tileY = 0; tileY < BOARD_SIZE; tileY++) {
    for (let tileX = 0; tileX < BOARD_SIZE; tileX++) {
      const posX = tileX * tileSize;
      const posY = tileY * tileSize;

      context.fillStyle = (tileX + tileY) % 2 === 0 ? "#f0d9b5" : "#b58863";
      context.fillRect(posX, posY, tileSize, tileSize);
    }
  }

  if (prevMove) {
    context.save();
    context.fillStyle = "rgba(255, 221, 87, 0.62)";

    for (const tile of [prevMove.from, prevMove.to]) {
      const centerX = (tile.x + 0.5) * tileSize;
      const centerY = (tile.y + 0.5) * tileSize;
      const radius = tileSize * 0.38;

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  for (let tileY = 0; tileY < BOARD_SIZE; tileY++) {
    for (let tileX = 0; tileX < BOARD_SIZE; tileX++) {
      const piece = boardState.board[tileY][tileX];
      if (!piece) continue;
      if (
        draggedFrom && tileX === draggedFrom.x &&
        tileY === draggedFrom.y
      ) {
        continue;
      }

      const image = pieceImages[piece.color][piece.type];
      const posX = tileX * tileSize;
      const posY = tileY * tileSize;

      context.drawImage(image, posX, posY, tileSize, tileSize);
    }
  }

  context.save();
  context.fillStyle = "rgba(16, 16, 16, 0.22)";

  for (const circle of circles) {
    const centerX = (circle.x + 0.5) * tileSize;
    const centerY = (circle.y + 0.5) * tileSize;
    const radius = tileSize * 0.18;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();

  if (!draggedFrom || !dragPointerPos || !floatingPiece) return;

  const pieceImage = pieceImages[floatingPiece.color][floatingPiece.type];
  const ghostPosX = draggedFrom.x * tileSize;
  const ghostPosY = draggedFrom.y * tileSize;

  context.save();
  context.globalAlpha = 0.35;
  context.drawImage(pieceImage, ghostPosX, ghostPosY, tileSize, tileSize);
  context.restore();

  const offset = tileSize / 2;
  context.drawImage(
    pieceImage,
    dragPointerPos.x - offset,
    dragPointerPos.y - offset,
    tileSize,
    tileSize,
  );
}

function getCurrentInteractionState(
  interaction: InteractionState,
  turn: BoardState["turn"],
): InteractionState {
  if (interaction.turn === turn) return interaction;

  return {
    turn,
    selectedFrom: null,
    legalMoves: [],
    dragPointerPos: null,
  };
}

export function Board(
  props: {
    boardState: BoardState;
    onMoveAttempt: (move: MoveInput) => void;
  },
) {
  const [interaction, setInteraction] = useState<InteractionState>(() => ({
    turn: props.boardState.turn,
    selectedFrom: null,
    legalMoves: [],
    dragPointerPos: null,
  }));
  const [prevMove, setPrevMove] = useState<MoveInput | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const dragStartPointerRef = useRef<CanvasPoint | null>(null);
  const moveCommittedRef = useRef(false);

  const hasCurrentInteraction = interaction.turn === props.boardState.turn;
  const selectedFrom = hasCurrentInteraction ? interaction.selectedFrom : null;
  const legalMoves = hasCurrentInteraction
    ? interaction.legalMoves
    : EMPTY_SQUARES;
  const dragPointerPos = hasCurrentInteraction
    ? interaction.dragPointerPos
    : null;

  const draw = useEffectEvent(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    drawBoard(
      canvas,
      context,
      props.boardState,
      getPieceImages(),
      prevMove,
      selectedFrom,
      dragPointerPos,
      legalMoves,
    );
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    contextRef.current = context;
    draw();

    const handleResize = () => {
      draw();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", handleResize);

    return () => {
      if (contextRef.current === context) {
        contextRef.current = null;
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    draw();
  }, [props.boardState, prevMove, selectedFrom, dragPointerPos, legalMoves]);

  useEffect(() => {
    dragStartPointerRef.current = null;
    moveCommittedRef.current = false;
  }, [props.boardState.turn]);

  const clearInteractionState = () => {
    setInteraction({
      turn: props.boardState.turn,
      selectedFrom: null,
      legalMoves: [],
      dragPointerPos: null,
    });
    dragStartPointerRef.current = null;
  };

  const executeLegalMove = (from: Square, to: Square) => {
    const move = { from, to };
    moveCommittedRef.current = true;
    clearInteractionState();
    setPrevMove(move);
    props.onMoveAttempt(move);
  };

  const handlePointerDown: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);

    const { pointerPos, tileIndex } = toBoardPointerData(e);

    if (selectedFrom && hasMove(legalMoves, tileIndex)) {
      executeLegalMove(selectedFrom, tileIndex);
      return;
    }

    const piece = props.boardState.board[tileIndex.y][tileIndex.x];
    if (!piece || piece.color !== props.boardState.turn) {
      clearInteractionState();
      return;
    }

    const nextLegalMoves = getLegalMoves(tileIndex, props.boardState);
    setInteraction({
      turn: props.boardState.turn,
      selectedFrom: tileIndex,
      legalMoves: nextLegalMoves,
      dragPointerPos: null,
    });
    dragStartPointerRef.current = pointerPos;
  };

  const handlePointerMove: PointerEventHandler<HTMLCanvasElement> = (e) => {
    const dragStartPointer = dragStartPointerRef.current;
    if (!dragStartPointer) return;

    const { pointerPos } = toBoardPointerData(e);
    const dx = pointerPos.x - dragStartPointer.x;
    const dy = pointerPos.y - dragStartPointer.y;
    const isDragging = Math.hypot(dx, dy) > 6;

    if (!dragPointerPos && !isDragging) return;

    setInteraction((current) => ({
      ...getCurrentInteractionState(current, props.boardState.turn),
      dragPointerPos: pointerPos,
    }));
  };

  const handlePointerUp: PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (moveCommittedRef.current) {
      moveCommittedRef.current = false;
      return;
    }

    const { tileIndex } = toBoardPointerData(e);
    const sourceTile = selectedFrom;

    setInteraction((current) => ({
      ...getCurrentInteractionState(current, props.boardState.turn),
      dragPointerPos: null,
    }));
    dragStartPointerRef.current = null;

    if (!sourceTile) return;

    const nextLegalMoves = getLegalMoves(sourceTile, props.boardState);
    if (hasMove(nextLegalMoves, tileIndex)) {
      executeLegalMove(sourceTile, tileIndex);
      return;
    }

    if (!selectedFrom || !squaresEqual(selectedFrom, sourceTile)) {
      setInteraction({
        turn: props.boardState.turn,
        selectedFrom: sourceTile,
        legalMoves: nextLegalMoves,
        dragPointerPos: null,
      });
    }
  };

  const handlePointerCancel: PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setInteraction((current) => ({
      ...getCurrentInteractionState(current, props.boardState.turn),
      dragPointerPos: null,
    }));
    dragStartPointerRef.current = null;
    moveCommittedRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      className="board-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
}
