import {
  type PointerEvent,
  type PointerEventHandler,
  useEffect,
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
  startedAtMs: number | null;
  durationMs: number;
};

const EMPTY_SQUARES: Square[] = [];
const MAX_BOARD_DPR = 3;
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
  context.imageSmoothingQuality = "high";
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

  if (selectedFrom) {
    context.save();
    context.fillStyle = "rgba(96, 96, 96, 0.34)";

    const centerX = (selectedFrom.x + 0.5) * metrics.tileSize;
    const centerY = (selectedFrom.y + 0.5) * metrics.tileSize;
    const radius = metrics.tileSize * 0.34;

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  if (prevMove) {
    context.save();
    context.fillStyle = "rgba(255, 221, 87, 0.62)";

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
  const floatingPiece = boardState.board[selectedFrom.y]?.[selectedFrom.x] ?? null;
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

  const interactionRef = useRef<InteractionState>({
    turn: props.boardState.turn,
    selectedFrom: null,
    legalMoves: [],
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const boardMetricsRef = useRef<BoardMetrics | null>(null);
  const dragPointerPosRef = useRef<CanvasPoint | null>(null);
  const dragStartPointerRef = useRef<CanvasPoint | null>(null);
  const frameRequestRef = useRef<number | null>(null);
  const staticLayerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticLayerContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const staticLayerSnapshotRef = useRef<StaticLayerSnapshot | null>(null);
  const pendingMoveAnimationRef = useRef<PendingMoveAnimation | null>(null);
  const activeMoveAnimationRef = useRef<ActiveMoveAnimation | null>(null);
  const runDrawRef = useRef<(frameTimeMs?: number) => void>(() => {});
  const scheduleDrawRef = useRef(() => {});

  const hasCurrentInteraction = interaction.turn === props.boardState.turn;
  const selectedFrom = hasCurrentInteraction ? interaction.selectedFrom : null;
  const legalMoves = hasCurrentInteraction
    ? interaction.legalMoves
    : EMPTY_SQUARES;

  function setInteractionState(nextInteraction: InteractionState) {
    interactionRef.current = nextInteraction;
    setInteraction(nextInteraction);
  }

  function getActiveInteraction(): InteractionState {
    const currentInteraction = interactionRef.current;
    if (currentInteraction.turn === props.boardState.turn) {
      return currentInteraction;
    }

    return {
      turn: props.boardState.turn,
      selectedFrom: null,
      legalMoves: [],
    };
  }

  const cancelScheduledDraw = () => {
    if (frameRequestRef.current === null) return;
    cancelAnimationFrame(frameRequestRef.current);
    frameRequestRef.current = null;
  };

  const runUpdateCanvasMetrics = (): boolean => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const staticLayerCanvas = staticLayerCanvasRef.current;
    const staticLayerContext = staticLayerContextRef.current;
    if (!canvas || !context || !staticLayerCanvas || !staticLayerContext) {
      return false;
    }

    const metrics = getBoardMetrics(canvas);
    if (metrics.cssSize === 0 || metrics.pixelSize === 0) {
      boardMetricsRef.current = null;
      return false;
    }
    boardMetricsRef.current = metrics;

    resizeCanvas(canvas, metrics);
    resizeCanvas(staticLayerCanvas, metrics);
    prepareContext(context, metrics);
    prepareContext(staticLayerContext, metrics);
    return true;
  };

  function scheduleDraw() {
    if (frameRequestRef.current !== null) return;

    frameRequestRef.current = requestAnimationFrame((frameTimeMs) => {
      frameRequestRef.current = null;
      runDraw(frameTimeMs);
    });
  }

  const runDraw = (frameTimeMs?: number) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const staticLayerCanvas = staticLayerCanvasRef.current;
    const staticLayerContext = staticLayerContextRef.current;
    if (!canvas || !context || !staticLayerCanvas || !staticLayerContext) {
      return;
    }
    if (!runUpdateCanvasMetrics()) {
      scheduleDraw();
      return;
    }
    const metrics = boardMetricsRef.current;
    if (!metrics) return;

    const boardState = props.boardState;
    const pieceImages = getPieceImages();
    const dragPointerPos = dragPointerPosRef.current;
    const currentInteraction = getActiveInteraction();
    const currentSelectedFrom = currentInteraction.selectedFrom;
    const currentLegalMoves = currentInteraction.legalMoves;
    const isDragging = currentSelectedFrom !== null && dragPointerPos !== null;
    const pendingAnimation = pendingMoveAnimationRef.current;

    if (!activeMoveAnimationRef.current && pendingAnimation) {
      const destinationPiece =
        boardState.board[pendingAnimation.move.to.y]?.[pendingAnimation.move.to.x] ??
        null;

      if (
        destinationPiece &&
        destinationPiece.color === pendingAnimation.piece.color &&
        destinationPiece.type === pendingAnimation.piece.type
      ) {
        activeMoveAnimationRef.current = {
          ...pendingAnimation,
          startedAtMs: frameTimeMs ?? null,
          durationMs: CLICK_MOVE_ANIMATION_MS,
        };
        pendingMoveAnimationRef.current = null;
      }
    }

    let activeAnimation = activeMoveAnimationRef.current;
    let animationProgress = 0;
    if (activeAnimation) {
      if (activeAnimation.startedAtMs === null && frameTimeMs !== undefined) {
        activeAnimation = {
          ...activeAnimation,
          startedAtMs: frameTimeMs,
        };
        activeMoveAnimationRef.current = activeAnimation;
      }

      const rawProgress = (
        activeAnimation.startedAtMs === null || frameTimeMs === undefined
      )
        ? 0
        : (frameTimeMs - activeAnimation.startedAtMs) / activeAnimation.durationMs;

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
        currentSelectedFrom,
        currentLegalMoves,
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
        currentSelectedFrom,
        isDragging,
        animatedMove,
        currentLegalMoves,
      );

      staticLayerSnapshotRef.current = {
        boardState,
        prevMove,
        selectedFrom: currentSelectedFrom,
        legalMoves: currentLegalMoves,
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

    if (currentSelectedFrom && dragPointerPos) {
      drawFloatingPiece(
        context,
        metrics,
        boardState,
        pieceImages,
        currentSelectedFrom,
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
  };

  useLayoutEffect(() => {
    runDrawRef.current = runDraw;
    scheduleDrawRef.current = scheduleDraw;
  });

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
    const handleResize = () => {
      if (pendingMoveAnimationRef.current || activeMoveAnimationRef.current) {
        scheduleDrawRef.current();
        return;
      }
      runDrawRef.current();
    };

    runDrawRef.current();
    const initialFrameId = requestAnimationFrame(handleResize);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(initialFrameId);
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

  useLayoutEffect(() => {
    if (pendingMoveAnimationRef.current || activeMoveAnimationRef.current) {
      scheduleDrawRef.current();
      return;
    }
    runDrawRef.current();
  }, [props.boardState, prevMove, selectedFrom, legalMoves]);

  useEffect(() => {
    cancelScheduledDraw();
    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;
    interactionRef.current = {
      turn: props.boardState.turn,
      selectedFrom: null,
      legalMoves: [],
    };
  }, [props.boardState.turn]);

  const clearInteractionState = () => {
    cancelScheduledDraw();
    dragPointerPosRef.current = null;
    setInteractionState({
      turn: props.boardState.turn,
      selectedFrom: null,
      legalMoves: [],
    });
    dragStartPointerRef.current = null;
  };

  const executeLegalMove = (from: Square, to: Square, shouldAnimate: boolean) => {
    const move = { from, to };
    const movingPiece = props.boardState.board[from.y]?.[from.x] ?? null;

    cancelScheduledDraw();
    activeMoveAnimationRef.current = null;
    pendingMoveAnimationRef.current = shouldAnimate && movingPiece
      ? { move, piece: movingPiece }
      : null;
    staticLayerSnapshotRef.current = null;
    clearInteractionState();
    setPrevMove(move);
    props.onMoveAttempt(move);
  };

  const handlePointerDown: PointerEventHandler<HTMLCanvasElement> = (e) => {
    cancelScheduledDraw();

    const { pointerPos, tileIndex } = toBoardPointerData(e);
    const piece = props.boardState.board[tileIndex.y][tileIndex.x];
    if (!piece || piece.color !== props.boardState.turn) {
      dragStartPointerRef.current = null;
      return;
    }

    const nextLegalMoves = getLegalMoves(tileIndex, props.boardState);
    dragPointerPosRef.current = null;
    setInteractionState({
      turn: props.boardState.turn,
      selectedFrom: tileIndex,
      legalMoves: nextLegalMoves,
    });
    dragStartPointerRef.current = pointerPos;
    runDraw();
  };

  const handlePointerMove: PointerEventHandler<HTMLCanvasElement> = (e) => {
    const dragStartPointer = dragStartPointerRef.current;
    if (!dragStartPointer || !getActiveInteraction().selectedFrom) return;

    const { pointerPos } = toBoardPointerData(e);
    const dx = pointerPos.x - dragStartPointer.x;
    const dy = pointerPos.y - dragStartPointer.y;
    const isDragging = Math.hypot(dx, dy) > 6;

    if (!dragPointerPosRef.current && !isDragging) return;

    if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    dragPointerPosRef.current = pointerPos;
    scheduleDraw();
  };

  const handlePointerUp: PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const { tileIndex } = toBoardPointerData(e);
    const currentInteraction = getActiveInteraction();
    const sourceTile = currentInteraction.selectedFrom;
    const wasDragging = dragPointerPosRef.current !== null;

    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;

    if (!sourceTile) {
      if (wasDragging) scheduleDraw();
      return;
    }

    if (hasMove(currentInteraction.legalMoves, tileIndex)) {
      executeLegalMove(sourceTile, tileIndex, !wasDragging);
      return;
    }

    const piece = props.boardState.board[tileIndex.y][tileIndex.x];
    if (piece && piece.color === props.boardState.turn) {
      const nextLegalMoves = getLegalMoves(tileIndex, props.boardState);
      setInteractionState({
        turn: props.boardState.turn,
        selectedFrom: tileIndex,
        legalMoves: nextLegalMoves,
      });
      runDraw();
      return;
    }

    clearInteractionState();
    if (wasDragging) runDraw();
  };

  const handlePointerCancel: PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const wasDragging = dragPointerPosRef.current !== null;
    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;
    if (wasDragging) runDraw();
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
