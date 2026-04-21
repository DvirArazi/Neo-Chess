import {
  type PointerEvent,
  type PointerEventHandler,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getPieceImages, type PieceImages } from "./pieceAssets";
import type { MoveInput, Square } from "../types";
import type { BoardState, Piece } from "./types";
import { BOARD_SIZE } from "./setup";
import { getLegalMoves } from "../../../shared/chess/moveGeneration";

type CanvasPoint = {
  x: number;
  y: number;
};

type BoardMetrics = {
  cssSize: number;
  tileSize: number;
  dpr: number;
  pixelSize: number;
};

type InteractionState = {
  turn: BoardState["turn"];
  selectedFrom: Square | null;
  legalMoves: Square[];
};

type StaticLayerSnapshot = {
  boardState: BoardState;
  prevMove: MoveInput | null;
  selectedFrom: Square | null;
  legalMoves: Square[];
  isDragging: boolean;
  animatedMove: MoveInput | null;
  cssSize: number;
  pixelSize: number;
};

type PendingMoveAnimation = {
  move: MoveInput;
  piece: Piece;
};

type ActiveMoveAnimation = PendingMoveAnimation & {
  startedAtMs: number;
  durationMs: number;
};

const EMPTY_SQUARES: Square[] = [];
const MAX_BOARD_DPR = 2;
const CLICK_MOVE_ANIMATION_MS = 120;

function squaresEqual(a: Square, b: Square): boolean {
  return a.x === b.x && a.y === b.y;
}

function optionalSquaresEqual(a: Square | null, b: Square | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return squaresEqual(a, b);
}

function optionalMovesEqual(a: MoveInput | null, b: MoveInput | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    optionalSquaresEqual(a.from, b.from) &&
    optionalSquaresEqual(a.to, b.to)
  );
}

function hasMove(moves: Square[], target: Square): boolean {
  return moves.some((move) => squaresEqual(move, target));
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
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

function getBoardMetrics(canvas: HTMLCanvasElement): BoardMetrics {
  const cssSize = canvas.getBoundingClientRect().width;
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_BOARD_DPR);

  return {
    cssSize,
    tileSize: cssSize / BOARD_SIZE,
    dpr,
    pixelSize: Math.round(cssSize * dpr),
  };
}

function resizeCanvas(canvas: HTMLCanvasElement, metrics: BoardMetrics): void {
  if (
    canvas.width === metrics.pixelSize &&
    canvas.height === metrics.pixelSize
  ) {
    return;
  }

  canvas.width = metrics.pixelSize;
  canvas.height = metrics.pixelSize;
}

function prepareContext(
  context: CanvasRenderingContext2D,
  metrics: BoardMetrics,
): void {
  context.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
  context.clearRect(0, 0, metrics.cssSize, metrics.cssSize);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "medium";
}

function drawStaticBoardLayer(
  context: CanvasRenderingContext2D,
  metrics: BoardMetrics,
  boardState: BoardState,
  pieceImages: PieceImages,
  prevMove: MoveInput | null,
  selectedFrom: Square | null,
  isDragging: boolean,
  animatedMove: MoveInput | null,
  circles: Square[],
): void {
  prepareContext(context, metrics);

  const draggedFrom = isDragging ? selectedFrom : null;
  const floatingPiece = draggedFrom
    ? boardState.board[draggedFrom.y]?.[draggedFrom.x] ?? null
    : null;

  for (let tileY = 0; tileY < BOARD_SIZE; tileY++) {
    for (let tileX = 0; tileX < BOARD_SIZE; tileX++) {
      const posX = tileX * metrics.tileSize;
      const posY = tileY * metrics.tileSize;

      context.fillStyle = (tileX + tileY) % 2 === 0 ? "#f0d9b5" : "#b58863";
      context.fillRect(posX, posY, metrics.tileSize, metrics.tileSize);
    }
  }

  if (prevMove) {
    context.save();
    context.fillStyle = "rgba(255, 221, 87, 0.5)";

    for (const tile of [prevMove.from, prevMove.to]) {
      const centerX = (tile.x + 0.5) * metrics.tileSize;
      const centerY = (tile.y + 0.5) * metrics.tileSize;
      const radius = metrics.tileSize * 0.38;

      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  context.save();
  context.fillStyle = "rgba(16, 16, 16, 0.13)";

  if (selectedFrom) {
    const centerX = (selectedFrom.x + 0.5) * metrics.tileSize;
    const centerY = (selectedFrom.y + 0.5) * metrics.tileSize;
    const radius = metrics.tileSize * 0.38;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();

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
      if (
        animatedMove && tileX === animatedMove.to.x &&
        tileY === animatedMove.to.y
      ) {
        continue;
      }

      const image = pieceImages[piece.color][piece.type];
      const posX = tileX * metrics.tileSize;
      const posY = tileY * metrics.tileSize;

      context.drawImage(image, posX, posY, metrics.tileSize, metrics.tileSize);
    }
  }

  context.save();
  context.fillStyle = "rgba(16, 16, 16, 0.22)";

  for (const circle of circles) {
    const centerX = (circle.x + 0.5) * metrics.tileSize;
    const centerY = (circle.y + 0.5) * metrics.tileSize;
    const radius = metrics.tileSize * 0.18;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();

  if (!draggedFrom || !floatingPiece) return;

  const pieceImage = pieceImages[floatingPiece.color][floatingPiece.type];
  const ghostPosX = draggedFrom.x * metrics.tileSize;
  const ghostPosY = draggedFrom.y * metrics.tileSize;

  context.save();
  context.globalAlpha = 0.35;
  context.drawImage(
    pieceImage,
    ghostPosX,
    ghostPosY,
    metrics.tileSize,
    metrics.tileSize,
  );
  context.restore();
}

function drawFloatingPiece(
  context: CanvasRenderingContext2D,
  metrics: BoardMetrics,
  boardState: BoardState,
  pieceImages: PieceImages,
  selectedFrom: Square,
  dragPointerPos: CanvasPoint,
): void {
  const floatingPiece = boardState.board[selectedFrom.y]?.[selectedFrom.x] ??
    null;
  if (!floatingPiece) return;

  const pieceImage = pieceImages[floatingPiece.color][floatingPiece.type];
  const offset = metrics.tileSize / 2;
  context.drawImage(
    pieceImage,
    dragPointerPos.x - offset,
    dragPointerPos.y - offset,
    metrics.tileSize,
    metrics.tileSize,
  );
}

function drawAnimatedPiece(
  context: CanvasRenderingContext2D,
  metrics: BoardMetrics,
  pieceImages: PieceImages,
  animation: ActiveMoveAnimation,
  progress: number,
): void {
  const pieceImage = pieceImages[animation.piece.color][animation.piece.type];
  const currentX = animation.move.from.x + (
        animation.move.to.x - animation.move.from.x
      ) * progress;
  const currentY = animation.move.from.y + (
        animation.move.to.y - animation.move.from.y
      ) * progress;

  context.drawImage(
    pieceImage,
    currentX * metrics.tileSize,
    currentY * metrics.tileSize,
    metrics.tileSize,
    metrics.tileSize,
  );
}

function isStaticLayerCurrent(
  snapshot: StaticLayerSnapshot | null,
  boardState: BoardState,
  prevMove: MoveInput | null,
  selectedFrom: Square | null,
  legalMoves: Square[],
  isDragging: boolean,
  animatedMove: MoveInput | null,
  metrics: BoardMetrics,
): boolean {
  if (!snapshot) return false;

  return (
    snapshot.boardState === boardState &&
    snapshot.prevMove === prevMove &&
    optionalSquaresEqual(snapshot.selectedFrom, selectedFrom) &&
    snapshot.legalMoves === legalMoves &&
    snapshot.isDragging === isDragging &&
    optionalMovesEqual(snapshot.animatedMove, animatedMove) &&
    snapshot.cssSize === metrics.cssSize &&
    snapshot.pixelSize === metrics.pixelSize
  );
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
  }));
  const [prevMove, setPrevMove] = useState<MoveInput | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const boardMetricsRef = useRef<BoardMetrics | null>(null);
  const dragPointerPosRef = useRef<CanvasPoint | null>(null);
  const dragStartPointerRef = useRef<CanvasPoint | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const moveCommittedRef = useRef(false);
  const staticLayerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticLayerContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const staticLayerSnapshotRef = useRef<StaticLayerSnapshot | null>(null);
  const pendingMoveAnimationRef = useRef<PendingMoveAnimation | null>(null);
  const activeMoveAnimationRef = useRef<ActiveMoveAnimation | null>(null);

  const hasCurrentInteraction = interaction.turn === props.boardState.turn;
  const selectedFrom = hasCurrentInteraction ? interaction.selectedFrom : null;
  const legalMoves = hasCurrentInteraction
    ? interaction.legalMoves
    : EMPTY_SQUARES;

  const cancelScheduledDraw = () => {
    if (frameRequestRef.current === null) return;
    cancelAnimationFrame(frameRequestRef.current);
    frameRequestRef.current = null;
  };

  const runUpdateCanvasMetrics = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const staticLayerCanvas = staticLayerCanvasRef.current;
    const staticLayerContext = staticLayerContextRef.current;
    if (!canvas || !context || !staticLayerCanvas || !staticLayerContext) {
      return;
    }

    const metrics = getBoardMetrics(canvas);
    boardMetricsRef.current = metrics;

    resizeCanvas(canvas, metrics);
    resizeCanvas(staticLayerCanvas, metrics);
    staticLayerSnapshotRef.current = null;
  };

  function runDraw(frameTimeMs?: number) {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const metrics = boardMetricsRef.current;
    const staticLayerCanvas = staticLayerCanvasRef.current;
    const staticLayerContext = staticLayerContextRef.current;
    if (
      !canvas || !context || !metrics || !staticLayerCanvas ||
      !staticLayerContext
    ) {
      return;
    }

    const boardState = props.boardState;
    const pieceImages = getPieceImages();
    const dragPointerPos = dragPointerPosRef.current;
    const isDragging = selectedFrom !== null && dragPointerPos !== null;
    const nowMs = frameTimeMs ?? performance.now();
    const pendingAnimation = pendingMoveAnimationRef.current;

    if (!activeMoveAnimationRef.current && pendingAnimation) {
      const destinationPiece = boardState.board[pendingAnimation.move.to.y]
        ?.[pendingAnimation.move.to.x] ??
        null;

      if (
        destinationPiece &&
        destinationPiece.color === pendingAnimation.piece.color &&
        destinationPiece.type === pendingAnimation.piece.type
      ) {
        activeMoveAnimationRef.current = {
          ...pendingAnimation,
          startedAtMs: nowMs,
          durationMs: CLICK_MOVE_ANIMATION_MS,
        };
        pendingMoveAnimationRef.current = null;
      }
    }

    let activeAnimation = activeMoveAnimationRef.current;
    let animationProgress = 0;
    if (activeAnimation) {
      const rawProgress = (
        nowMs - activeAnimation.startedAtMs
      ) / activeAnimation.durationMs;

      if (rawProgress >= 1) {
        activeMoveAnimationRef.current = null;
        activeAnimation = null;
        staticLayerSnapshotRef.current = null;
      } else {
        animationProgress = easeOutCubic(rawProgress);
      }
    }

    const animatedMove = activeAnimation?.move ?? null;

    if (
      !isStaticLayerCurrent(
        staticLayerSnapshotRef.current,
        boardState,
        prevMove,
        selectedFrom,
        legalMoves,
        isDragging,
        animatedMove,
        metrics,
      )
    ) {
      drawStaticBoardLayer(
        staticLayerContext,
        metrics,
        boardState,
        pieceImages,
        prevMove,
        selectedFrom,
        isDragging,
        animatedMove,
        legalMoves,
      );

      staticLayerSnapshotRef.current = {
        boardState,
        prevMove,
        selectedFrom,
        legalMoves,
        isDragging,
        animatedMove,
        cssSize: metrics.cssSize,
        pixelSize: metrics.pixelSize,
      };
    }

    prepareContext(context, metrics);
    context.drawImage(
      staticLayerCanvas,
      0,
      0,
      staticLayerCanvas.width,
      staticLayerCanvas.height,
      0,
      0,
      metrics.cssSize,
      metrics.cssSize,
    );

    if (selectedFrom && dragPointerPos) {
      drawFloatingPiece(
        context,
        metrics,
        boardState,
        pieceImages,
        selectedFrom,
        dragPointerPos,
      );
    }

    if (activeAnimation) {
      drawAnimatedPiece(
        context,
        metrics,
        pieceImages,
        activeAnimation,
        animationProgress,
      );
      scheduleDraw();
    }
  }

  const updateCanvasMetrics = useEffectEvent(() => {
    runUpdateCanvasMetrics();
  });

  const draw = useEffectEvent(() => {
    runDraw();
  });

  function scheduleDraw() {
    if (frameRequestRef.current !== null) return;

    frameRequestRef.current = requestAnimationFrame((frameTimeMs) => {
      frameRequestRef.current = null;
      runDraw(frameTimeMs);
    });
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const staticLayerCanvas = document.createElement("canvas");
    const staticLayerContext = staticLayerCanvas.getContext("2d");
    if (!staticLayerContext) return;

    contextRef.current = context;
    staticLayerCanvasRef.current = staticLayerCanvas;
    staticLayerContextRef.current = staticLayerContext;
    updateCanvasMetrics();
    draw();

    const handleResize = () => {
      updateCanvasMetrics();
      draw();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelScheduledDraw();
      if (contextRef.current === context) {
        contextRef.current = null;
      }
      if (staticLayerContextRef.current === staticLayerContext) {
        staticLayerContextRef.current = null;
      }
      if (staticLayerCanvasRef.current === staticLayerCanvas) {
        staticLayerCanvasRef.current = null;
      }
      boardMetricsRef.current = null;
      staticLayerSnapshotRef.current = null;
      pendingMoveAnimationRef.current = null;
      activeMoveAnimationRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    draw();
  }, [props.boardState, prevMove, selectedFrom, legalMoves]);

  useEffect(() => {
    if (!pendingMoveAnimationRef.current && !activeMoveAnimationRef.current) {
      cancelScheduledDraw();
    }
    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;
    moveCommittedRef.current = false;
  }, [props.boardState.turn]);

  const clearInteractionState = () => {
    cancelScheduledDraw();
    dragPointerPosRef.current = null;
    setInteraction({
      turn: props.boardState.turn,
      selectedFrom: null,
      legalMoves: [],
    });
    dragStartPointerRef.current = null;
  };

  const executeLegalMove = (
    from: Square,
    to: Square,
    shouldAnimate: boolean,
  ) => {
    const move = { from, to };
    const movingPiece = props.boardState.board[from.y]?.[from.x] ?? null;
    cancelScheduledDraw();
    activeMoveAnimationRef.current = null;
    pendingMoveAnimationRef.current = shouldAnimate && movingPiece
      ? { move, piece: movingPiece }
      : null;
    staticLayerSnapshotRef.current = null;
    moveCommittedRef.current = true;
    clearInteractionState();
    setPrevMove(move);
    props.onMoveAttempt(move);
  };

  const handlePointerDown: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelScheduledDraw();

    const { pointerPos, tileIndex } = toBoardPointerData(e);

    if (selectedFrom && hasMove(legalMoves, tileIndex)) {
      executeLegalMove(selectedFrom, tileIndex, true);
      return;
    }

    const piece = props.boardState.board[tileIndex.y][tileIndex.x];
    if (!piece || piece.color !== props.boardState.turn) {
      clearInteractionState();
      return;
    }

    const nextLegalMoves = getLegalMoves(tileIndex, props.boardState);
    dragPointerPosRef.current = pointerPos;
    setInteraction({
      turn: props.boardState.turn,
      selectedFrom: tileIndex,
      legalMoves: nextLegalMoves,
    });
    dragStartPointerRef.current = pointerPos;
  };

  const handlePointerMove: PointerEventHandler<HTMLCanvasElement> = (e) => {
    const dragStartPointer = dragStartPointerRef.current;
    if (!dragStartPointer) {
      const { tileIndex } = toBoardPointerData(e);
      const piece = props.boardState.board[tileIndex.y]?.[tileIndex.x] ?? null;
      e.currentTarget.style.cursor = piece && piece.color == props.boardState.turn
        ? "pointer"
        : "default";
      return;
    }
    e.currentTarget.style.cursor = "pointer";

    const { pointerPos } = toBoardPointerData(e);
    dragPointerPosRef.current = pointerPos;
    scheduleDraw();
  };

  const handlePointerUp: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.currentTarget.style.cursor = "default";

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (moveCommittedRef.current) {
      moveCommittedRef.current = false;
      return;
    }

    const { tileIndex } = toBoardPointerData(e);
    const sourceTile = selectedFrom;
    const wasDragging = dragPointerPosRef.current !== null;

    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;

    if (!sourceTile) {
      if (wasDragging) scheduleDraw();
      return;
    }

    if (hasMove(legalMoves, tileIndex)) {
      executeLegalMove(sourceTile, tileIndex, false);
      return;
    }

    if (wasDragging) scheduleDraw();
  };

  const handlePointerCancel: PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const wasDragging = dragPointerPosRef.current !== null;
    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;
    moveCommittedRef.current = false;
    if (wasDragging) scheduleDraw();
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
