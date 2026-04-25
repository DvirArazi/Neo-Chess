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
import type { GameState, Piece } from "./types";
import { BOARD_SIZE } from "../../../shared/chess/setup";
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
  turn: GameState["turn"];
  selectedFrom: Square | null;
  legalMoves: Square[];
};

type StaticLayerSnapshot = {
  gameState: GameState;
  prevMove: MoveInput | null;
  selectedFrom: Square | null;
  legalMoves: Square[];
  isDragging: boolean;
  animatedMoves: MoveInput[];
  animatedPopIns: Square[];
  cssSize: number;
  pixelSize: number;
};

type ActiveMoveAnimation = {
  move: MoveInput;
  piece: Piece;
  startedAtMs: number;
  durationMs: number;
};

type ActivePopAnimation = {
  square: Square;
  piece: Piece;
  startedAtMs: number;
  durationMs: number;
};

const EMPTY_SQUARES: Square[] = [];
const MAX_BOARD_DPR = 2;
const CLICK_MOVE_ANIMATION_MS = 120;
const DRAG_SNAP_DISTANCE_PX = 6;

function squaresEqual(a: Square, b: Square): boolean {
  return a.x === b.x && a.y === b.y;
}

function optionalSquaresEqual(a: Square | null, b: Square | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return squaresEqual(a, b);
}

function movesEqual(a: MoveInput, b: MoveInput): boolean {
  return squaresEqual(a.from, b.from) && squaresEqual(a.to, b.to);
}

function moveListsEqual(a: MoveInput[], b: MoveInput[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (!movesEqual(a[index], b[index])) return false;
  }

  return true;
}

function squareListsEqual(a: Square[], b: Square[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (!squaresEqual(a[index], b[index])) return false;
  }

  return true;
}

function hasMove(moves: Square[], target: Square): boolean {
  return moves.some((move) => squaresEqual(move, target));
}

function getPointerDistance(a: CanvasPoint, b: CanvasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getPieceKey(piece: Piece): string {
  return `${piece.color}:${piece.type}`;
}

function compareSquares(a: Square, b: Square): number {
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

function collectResetAnimations(
  previousGameState: GameState,
  nextGameState: GameState,
): {
  movedPieces: Array<{ move: MoveInput; piece: Piece }>;
  poppedPieces: Array<{ square: Square; piece: Piece }>;
} {
  const previousPiecesByKey = new Map<string, Square[]>();
  const nextPiecesByKey = new Map<string, Square[]>();
  const pieceByKey = new Map<string, Piece>();

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const previousPiece = previousGameState.board[y][x];
      if (previousPiece) {
        const key = getPieceKey(previousPiece);
        const squares = previousPiecesByKey.get(key) ?? [];
        squares.push({ x, y });
        previousPiecesByKey.set(key, squares);
        pieceByKey.set(key, previousPiece);
      }

      const nextPiece = nextGameState.board[y][x];
      if (nextPiece) {
        const key = getPieceKey(nextPiece);
        const squares = nextPiecesByKey.get(key) ?? [];
        squares.push({ x, y });
        nextPiecesByKey.set(key, squares);
        pieceByKey.set(key, nextPiece);
      }
    }
  }

  const movedPieces: Array<{ move: MoveInput; piece: Piece }> = [];
  const poppedPieces: Array<{ square: Square; piece: Piece }> = [];

  for (const key of new Set([...previousPiecesByKey.keys(), ...nextPiecesByKey.keys()])) {
    const piece = pieceByKey.get(key);
    if (!piece) continue;

    const previousSquares = [...(previousPiecesByKey.get(key) ?? [])].sort(compareSquares);
    const nextSquares = [...(nextPiecesByKey.get(key) ?? [])].sort(compareSquares);

    const stationarySquares = new Set<string>();
    for (const previousSquare of previousSquares) {
      const match = nextSquares.find((nextSquare) => squaresEqual(previousSquare, nextSquare));
      if (match) {
        stationarySquares.add(`${previousSquare.x},${previousSquare.y}`);
      }
    }

    const remainingPreviousSquares = previousSquares.filter((square) =>
      !stationarySquares.has(`${square.x},${square.y}`)
    );
    const remainingNextSquares = nextSquares.filter((square) =>
      !stationarySquares.has(`${square.x},${square.y}`)
    );
    const movedCount = Math.min(
      remainingPreviousSquares.length,
      remainingNextSquares.length,
    );

    for (let index = 0; index < movedCount; index += 1) {
      movedPieces.push({
        move: {
          from: remainingPreviousSquares[index],
          to: remainingNextSquares[index],
        },
        piece,
      });
    }

    for (let index = movedCount; index < remainingNextSquares.length; index += 1) {
      poppedPieces.push({
        square: remainingNextSquares[index],
        piece,
      });
    }
  }

  return { movedPieces, poppedPieces };
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
  gameState: GameState,
  pieceImages: PieceImages,
  prevMove: MoveInput | null,
  selectedFrom: Square | null,
  isDragging: boolean,
  animatedMoves: MoveInput[],
  animatedPopIns: Square[],
  circles: Square[],
): void {
  prepareContext(context, metrics);

  const draggedFrom = isDragging ? selectedFrom : null;
  const floatingPiece = draggedFrom
    ? gameState.board[draggedFrom.y]?.[draggedFrom.x] ?? null
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
    context.fillStyle = "rgba(255, 221, 87, 0.2)";

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
      const piece = gameState.board[tileY][tileX];
      if (!piece) continue;
      if (
        draggedFrom && tileX === draggedFrom.x &&
        tileY === draggedFrom.y
      ) {
        continue;
      }
      if (animatedMoves.some((move) => tileX === move.to.x && tileY === move.to.y)) {
        continue;
      }
      if (animatedPopIns.some((square) => tileX === square.x && tileY === square.y)) {
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
  gameState: GameState,
  pieceImages: PieceImages,
  selectedFrom: Square,
  dragPointerPos: CanvasPoint,
): void {
  const floatingPiece = gameState.board[selectedFrom.y]?.[selectedFrom.x] ??
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

function drawPoppingPiece(
  context: CanvasRenderingContext2D,
  metrics: BoardMetrics,
  pieceImages: PieceImages,
  animation: ActivePopAnimation,
  progress: number,
): void {
  const pieceImage = pieceImages[animation.piece.color][animation.piece.type];
  const scale = 0.6 + (0.4 * progress);
  const size = metrics.tileSize * scale;
  const offset = (metrics.tileSize - size) / 2;

  context.save();
  context.globalAlpha = progress;
  context.drawImage(
    pieceImage,
    (animation.square.x * metrics.tileSize) + offset,
    (animation.square.y * metrics.tileSize) + offset,
    size,
    size,
  );
  context.restore();
}

function isStaticLayerCurrent(
  snapshot: StaticLayerSnapshot | null,
  gameState: GameState,
  prevMove: MoveInput | null,
  selectedFrom: Square | null,
  legalMoves: Square[],
  isDragging: boolean,
  animatedMoves: MoveInput[],
  animatedPopIns: Square[],
  metrics: BoardMetrics,
): boolean {
  if (!snapshot) return false;

  return (
    snapshot.gameState === gameState &&
    snapshot.prevMove === prevMove &&
    optionalSquaresEqual(snapshot.selectedFrom, selectedFrom) &&
    snapshot.legalMoves === legalMoves &&
    snapshot.isDragging === isDragging &&
    moveListsEqual(snapshot.animatedMoves, animatedMoves) &&
    squareListsEqual(snapshot.animatedPopIns, animatedPopIns) &&
    snapshot.cssSize === metrics.cssSize &&
    snapshot.pixelSize === metrics.pixelSize
  );
}

export function Board(
  props: {
    gameState: GameState;
    prevMove: MoveInput | null;
    transitionMove: MoveInput | null;
    shouldAnimateReset: boolean;
    onMoveAttempt: (move: MoveInput) => void;
  },
) {
  const [interaction, setInteraction] = useState<InteractionState>(() => ({
    turn: props.gameState.turn,
    selectedFrom: null,
    legalMoves: [],
  }));
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
  const activeMoveAnimationsRef = useRef<ActiveMoveAnimation[]>([]);
  const activePopAnimationsRef = useRef<ActivePopAnimation[]>([]);
  const previousGameStateRef = useRef<GameState | null>(null);
  const skipNextMoveAnimationRef = useRef(false);

  const hasCurrentInteraction = interaction.turn === props.gameState.turn;
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

    const gameState = props.gameState;
    const pieceImages = getPieceImages();
    const dragPointerPos = dragPointerPosRef.current;
    const isDragging = selectedFrom !== null && dragPointerPos !== null;
    const nowMs = frameTimeMs ?? performance.now();
    const activeAnimations = activeMoveAnimationsRef.current.filter((animation) => {
      const rawProgress = (nowMs - animation.startedAtMs) / animation.durationMs;
      return rawProgress < 1;
    });

    if (activeAnimations.length !== activeMoveAnimationsRef.current.length) {
      activeMoveAnimationsRef.current = activeAnimations;
      staticLayerSnapshotRef.current = null;
    }

    const activePopAnimations = activePopAnimationsRef.current.filter((animation) => {
      const rawProgress = (nowMs - animation.startedAtMs) / animation.durationMs;
      return rawProgress < 1;
    });

    if (activePopAnimations.length !== activePopAnimationsRef.current.length) {
      activePopAnimationsRef.current = activePopAnimations;
      staticLayerSnapshotRef.current = null;
    }

    const animatedMoves = activeAnimations.map((animation) => animation.move);
    const animatedPopIns = activePopAnimations.map((animation) => animation.square);

    if (
      !isStaticLayerCurrent(
        staticLayerSnapshotRef.current,
        gameState,
        props.prevMove,
        selectedFrom,
        legalMoves,
        isDragging,
        animatedMoves,
        animatedPopIns,
        metrics,
      )
    ) {
      drawStaticBoardLayer(
        staticLayerContext,
        metrics,
        gameState,
        pieceImages,
        props.prevMove,
        selectedFrom,
        isDragging,
        animatedMoves,
        animatedPopIns,
        legalMoves,
      );

      staticLayerSnapshotRef.current = {
        gameState,
        prevMove: props.prevMove,
        selectedFrom,
        legalMoves,
        isDragging,
        animatedMoves,
        animatedPopIns,
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
        gameState,
        pieceImages,
        selectedFrom,
        dragPointerPos,
      );
    }

    for (const activeAnimation of activeAnimations) {
      const rawProgress = (
        nowMs - activeAnimation.startedAtMs
      ) / activeAnimation.durationMs;
      const animationProgress = easeOutCubic(rawProgress);

      drawAnimatedPiece(
        context,
        metrics,
        pieceImages,
        activeAnimation,
        animationProgress,
      );
    }

    for (const activeAnimation of activePopAnimations) {
      const rawProgress = (
        nowMs - activeAnimation.startedAtMs
      ) / activeAnimation.durationMs;
      const animationProgress = easeOutCubic(rawProgress);

      drawPoppingPiece(
        context,
        metrics,
        pieceImages,
        activeAnimation,
        animationProgress,
      );
    }

    if (activeAnimations.length > 0 || activePopAnimations.length > 0) {
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
      activeMoveAnimationsRef.current = [];
      activePopAnimationsRef.current = [];
      previousGameStateRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const previousGameState = previousGameStateRef.current;
    const gameStateChanged = Boolean(
      previousGameState && previousGameState !== props.gameState,
    );
    const shouldSettleCurrentPosition = props.transitionMove === null &&
      activeMoveAnimationsRef.current.length > 0;

    if (gameStateChanged || shouldSettleCurrentPosition) {
      cancelScheduledDraw();
      activeMoveAnimationsRef.current = [];
      activePopAnimationsRef.current = [];
      staticLayerSnapshotRef.current = null;
    }

    previousGameStateRef.current = props.gameState;

    if (gameStateChanged && previousGameState) {
      if (skipNextMoveAnimationRef.current) {
        skipNextMoveAnimationRef.current = false;
      } else if (props.transitionMove) {
        const movingPiece = previousGameState.board[props.transitionMove.from.y]
          ?.[props.transitionMove.from.x] ??
          props.gameState.board[props.transitionMove.to.y]
            ?.[props.transitionMove.to.x] ??
          null;

        activeMoveAnimationsRef.current = movingPiece
          ? [{
            move: props.transitionMove,
            piece: movingPiece,
            startedAtMs: performance.now(),
            durationMs: CLICK_MOVE_ANIMATION_MS,
          }]
          : [];
        activePopAnimationsRef.current = [];
      } else if (props.shouldAnimateReset) {
        const resetAnimations = collectResetAnimations(previousGameState, props.gameState);
        const startedAtMs = performance.now();
        activeMoveAnimationsRef.current = resetAnimations.movedPieces.map((entry) => ({
          ...entry,
          startedAtMs,
          durationMs: CLICK_MOVE_ANIMATION_MS,
        }));
        activePopAnimationsRef.current = resetAnimations.poppedPieces.map((entry) => ({
          ...entry,
          startedAtMs,
          durationMs: CLICK_MOVE_ANIMATION_MS,
        }));
      } else {
        activeMoveAnimationsRef.current = [];
        activePopAnimationsRef.current = [];
      }
    }

    draw();
  }, [
    props.gameState,
    props.prevMove,
    props.transitionMove,
    props.shouldAnimateReset,
    selectedFrom,
    legalMoves,
  ]);

  useEffect(() => {
    if (
      activeMoveAnimationsRef.current.length === 0 &&
      activePopAnimationsRef.current.length === 0
    ) {
      cancelScheduledDraw();
    }
    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;
    moveCommittedRef.current = false;
    setInteraction({
      turn: props.gameState.turn,
      selectedFrom: null,
      legalMoves: [],
    });
  }, [props.gameState]);

  const clearInteractionState = () => {
    cancelScheduledDraw();
    dragPointerPosRef.current = null;
    setInteraction({
      turn: props.gameState.turn,
      selectedFrom: null,
      legalMoves: [],
    });
    dragStartPointerRef.current = null;
  };

  const executeLegalMove = (
    from: Square,
    to: Square,
    shouldAnimateTransition: boolean,
  ) => {
    const move = { from, to };
    cancelScheduledDraw();
    activeMoveAnimationsRef.current = [];
    activePopAnimationsRef.current = [];
    skipNextMoveAnimationRef.current = !shouldAnimateTransition;
    staticLayerSnapshotRef.current = null;
    moveCommittedRef.current = true;
    clearInteractionState();
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

    const piece = props.gameState.board[tileIndex.y][tileIndex.x];
    if (!piece || piece.color !== props.gameState.turn) {
      clearInteractionState();
      return;
    }

    const nextLegalMoves = getLegalMoves(tileIndex, props.gameState);
    dragPointerPosRef.current = pointerPos;
    setInteraction({
      turn: props.gameState.turn,
      selectedFrom: tileIndex,
      legalMoves: nextLegalMoves,
    });
    dragStartPointerRef.current = pointerPos;
  };

  const handlePointerMove: PointerEventHandler<HTMLCanvasElement> = (e) => {
    const { pointerPos, tileIndex } = toBoardPointerData(e);

    const dragStartPointer = dragStartPointerRef.current;
    if (!dragStartPointer) {
      const piece = props.gameState.board[tileIndex.y]?.[tileIndex.x] ?? null;
      e.currentTarget.style.cursor =
        piece && piece.color == props.gameState.turn ? "pointer" : "default";
      return;
    }
    e.currentTarget.style.cursor = "pointer";

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
    const dragStartPointer = dragStartPointerRef.current;
    const isDragMove = Boolean(
      dragStartPointer &&
      dragPointerPosRef.current &&
      getPointerDistance(dragStartPointer, dragPointerPosRef.current) >=
        DRAG_SNAP_DISTANCE_PX,
    );

    dragPointerPosRef.current = null;
    dragStartPointerRef.current = null;

    if (!sourceTile) {
      if (wasDragging) scheduleDraw();
      return;
    }

    if (hasMove(legalMoves, tileIndex)) {
      executeLegalMove(sourceTile, tileIndex, !isDragMove);
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
