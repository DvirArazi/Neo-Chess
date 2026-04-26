import { useEffect, useRef, useState } from "react";
import { createInitialBoard } from "../../shared/chess/setup";
import type { MoveInput, PieceColor } from "./chess/types";
import {
  applyMove,
  type BoardGameOutcome,
  getBoardGameOutcome,
} from "../../shared/chess/moveGeneration";
import { Game } from "./Game";
import { Popup } from "./Popup";
import { ActionsBar } from "./ActionsBar";
import whiteProfileImage from "./assets/images/localProfile/white.png";
import blackProfileImage from "./assets/images/localProfile/black.png";
import replayIcon from "./assets/images/replay.svg";
import pauseIcon from "./assets/images/pause.svg";
import playIcon from "./assets/images/play.svg";
import backIcon from "./assets/images/backwards.svg";
import nextIcon from "./assets/images/forwards.svg";
import currentPositionIcon from "./assets/images/double_forwards.svg";
import flipIcon from "./assets/images/flip_disabled.svg";
import flipLockIcon from "./assets/images/flip.svg";

type ClockSnapshot = Record<PieceColor, number>;
export type LocalTimeControl = {
  id: string;
  label: string;
  initialMs: number;
  incrementMs: number;
  isUnlimited?: boolean;
};

type GameOutcomeMessage = {
  title: string;
  detail: string;
};
type FlipMode = "flip" | "flip-lock";

const CLOCK_TICK_MS = 250;

function createInitialClocks(initialMs: number): ClockSnapshot {
  return {
    black: initialMs,
    white: initialMs,
  };
}

function getDisplayedClocks(
  baseClocks: ClockSnapshot,
  activeColor: PieceColor,
  anchorMs: number | null,
  nowMs: number,
): ClockSnapshot {
  if (anchorMs === null) return baseClocks;

  return {
    ...baseClocks,
    [activeColor]: Math.max(0, baseClocks[activeColor] - (nowMs - anchorMs)),
  };
}

function formatClock(clockMs: number): string {
  if (!Number.isFinite(clockMs)) return "∞";

  const totalSeconds = Math.ceil(Math.max(0, clockMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatColorName(color: PieceColor): string {
  return color === "white" ? "White" : "Black";
}

function oppositeColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

function getTimeoutOutcome(clocks: ClockSnapshot): GameOutcomeMessage | null {
  if (Number.isFinite(clocks.white) && clocks.white === 0) {
    return {
      title: "Black wins",
      detail: "White ran out of time",
    };
  }

  if (Number.isFinite(clocks.black) && clocks.black === 0) {
    return {
      title: "White wins",
      detail: "Black ran out of time",
    };
  }

  return null;
}

function getBoardOutcomeMessage(
  outcome: BoardGameOutcome | null,
): GameOutcomeMessage | null {
  if (!outcome) return null;

  if (outcome.result === "draw") {
    return {
      title: "Draw",
      detail: "Stalemate. The side to move has no legal moves",
    };
  }

  return {
    title: `${formatColorName(outcome.winner)} wins`,
    detail: `${
      formatColorName(
        outcome.winner === "white" ? "black" : "white",
      )
    } is checkmated.`,
  };
}

function applyIncrement(
  clocks: ClockSnapshot,
  color: PieceColor,
  incrementMs: number,
): ClockSnapshot {
  if (incrementMs === 0 || !Number.isFinite(clocks[color])) {
    return clocks;
  }

  return {
    ...clocks,
    [color]: clocks[color] + incrementMs,
  };
}

function LocalGame(props: { timeControl: LocalTimeControl }) {
  const initialClocks = createInitialClocks(props.timeControl.initialMs);
  const [history, setHistory] = useState([createInitialBoard()]);
  const [moves, setMoves] = useState<MoveInput[]>([]);
  const [clockHistory, setClockHistory] = useState<ClockSnapshot[]>([
    initialClocks,
  ]);
  const [clockSnapshot, setClockSnapshot] = useState<ClockSnapshot>(
    initialClocks,
  );
  const [clockTickMs, setClockTickMs] = useState(() => Date.now());
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [transitionMove, setTransitionMove] = useState<MoveInput | null>(null);
  const [shouldAnimateReset, setShouldAnimateReset] = useState(false);
  const [isPopupDismissed, setIsPopupDismissed] = useState(false);
  const [flipMode, setFlipMode] = useState<FlipMode>("flip-lock");
  const [bottomColorAtStart, setBottomColorAtStart] = useState<PieceColor>(() =>
    Math.random() < 0.5 ? "white" : "black"
  );
  const pendingHistoryIndexRef = useRef<number | null>(null);
  const pendingNavigationFrameRef = useRef<number | null>(null);
  const clockAnchorRef = useRef<number | null>(null);

  const gameState = history[historyIndex];
  const isViewingCurrentPosition = historyIndex === history.length - 1;
  const displayedMove = historyIndex > 0
    ? moves[historyIndex - 1] ?? null
    : null;
  const displayedClocks = getDisplayedClocks(
    clockSnapshot,
    gameState.turn,
    isPaused ? null : clockAnchorRef.current,
    clockTickMs,
  );
  const gameOutcome = getTimeoutOutcome(displayedClocks) ??
    getBoardOutcomeMessage(getBoardGameOutcome(gameState));
  const shouldShowPopup = Boolean(gameOutcome) && !isPopupDismissed;
  const topColor = oppositeColor(bottomColorAtStart);
  const bottomColor = bottomColorAtStart;
  const boardRotated = topColor === "white";
  const isTopPlayersTurn = gameState.turn === topColor;
  const modePieceRotations: Record<PieceColor, boolean> = {
    black: flipMode === "flip" ? isTopPlayersTurn : topColor === "black",
    white: flipMode === "flip" ? isTopPlayersTurn : topColor === "white",
  };
  const pieceRotations: Record<PieceColor, boolean> = {
    black: boardRotated !== modePieceRotations.black,
    white: boardRotated !== modePieceRotations.white,
  };
  const topPlayerRotated = flipMode === "flip-lock" || isTopPlayersTurn;
  const bottomPlayerRotated = flipMode === "flip" && isTopPlayersTurn;

  useEffect(() => {
    return () => {
      if (pendingNavigationFrameRef.current === null) return;
      cancelAnimationFrame(pendingNavigationFrameRef.current);
    };
  }, []);

  function getCurrentDisplayedClockSnapshot(nowMs = Date.now()): ClockSnapshot {
    return getDisplayedClocks(
      clockSnapshot,
      gameState.turn,
      isPaused ? null : clockAnchorRef.current,
      nowMs,
    );
  }

  useEffect(() => {
    if (
      isPaused ||
      gameOutcome ||
      getCurrentDisplayedClockSnapshot()[gameState.turn] === 0
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nowMs = Date.now();
      setClockTickMs(nowMs);

      if (getCurrentDisplayedClockSnapshot(nowMs)[gameState.turn] === 0) {
        window.clearInterval(intervalId);
      }
    }, CLOCK_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    isPaused,
    gameOutcome,
    gameState.turn,
    clockSnapshot.black,
    clockSnapshot.white,
  ]);

  const cancelPendingNavigation = () => {
    pendingHistoryIndexRef.current = null;
    if (pendingNavigationFrameRef.current === null) return;
    cancelAnimationFrame(pendingNavigationFrameRef.current);
    pendingNavigationFrameRef.current = null;
  };

  const scheduleHistoryNavigation = (
    nextHistoryIndex: number,
    nextTransitionMove: MoveInput,
  ) => {
    cancelPendingNavigation();
    pendingHistoryIndexRef.current = nextHistoryIndex;
    setTransitionMove(null);

    pendingNavigationFrameRef.current = requestAnimationFrame(() => {
      const nowMs = Date.now();
      pendingNavigationFrameRef.current = null;
      pendingHistoryIndexRef.current = null;
      setHistoryIndex(nextHistoryIndex);
      setClockSnapshot(clockHistory[nextHistoryIndex]);
      setClockTickMs(nowMs);
      clockAnchorRef.current = isPaused ? null : nowMs;
      setTransitionMove(nextTransitionMove);
    });
  };

  const scheduleResetNavigation = (nextHistoryIndex: number) => {
    cancelPendingNavigation();
    pendingHistoryIndexRef.current = nextHistoryIndex;
    setShouldAnimateReset(false);
    setTransitionMove(null);

    pendingNavigationFrameRef.current = requestAnimationFrame(() => {
      const nowMs = Date.now();
      pendingNavigationFrameRef.current = null;
      pendingHistoryIndexRef.current = null;
      setHistoryIndex(nextHistoryIndex);
      setClockSnapshot(clockHistory[nextHistoryIndex]);
      setClockTickMs(nowMs);
      clockAnchorRef.current = isPaused ? null : nowMs;
      setTransitionMove(null);
      setShouldAnimateReset(true);
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (
          target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT"
        )
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const currentHistoryIndex = pendingHistoryIndexRef.current ?? historyIndex;
        if (currentHistoryIndex === 0) return;

        const move = moves[currentHistoryIndex - 1];
        setShouldAnimateReset(false);
        setIsPopupDismissed(false);
        scheduleHistoryNavigation(currentHistoryIndex - 1, {
          from: move.to,
          to: move.from,
        });
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        const currentHistoryIndex = pendingHistoryIndexRef.current ?? historyIndex;
        if (currentHistoryIndex >= history.length - 1) return;

        setShouldAnimateReset(false);
        setIsPopupDismissed(false);
        scheduleHistoryNavigation(
          currentHistoryIndex + 1,
          moves[currentHistoryIndex],
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history.length, moves]);

  const handleMoveAttempt = (move: MoveInput) => {
    if (gameOutcome) return;
    cancelPendingNavigation();

    const nowMs = Date.now();
    const elapsedClockSnapshot = getCurrentDisplayedClockSnapshot(nowMs);
    if (elapsedClockSnapshot[gameState.turn] === 0) return;

    const nextGameState = applyMove(gameState, move);
    if (nextGameState === gameState) return;

    const nextClockSnapshot = applyIncrement(
      elapsedClockSnapshot,
      gameState.turn,
      props.timeControl.incrementMs,
    );

    setHistory([
      ...history.slice(0, historyIndex + 1),
      nextGameState,
    ]);
    setMoves([
      ...moves.slice(0, historyIndex),
      move,
    ]);
    setClockHistory([
      ...clockHistory.slice(0, historyIndex + 1),
      nextClockSnapshot,
    ]);
    setClockSnapshot(nextClockSnapshot);
    setClockTickMs(nowMs);
    clockAnchorRef.current = nowMs;
    setHistoryIndex(historyIndex + 1);
    setIsPaused(false);
    setTransitionMove(move);
    setShouldAnimateReset(false);
    setIsPopupDismissed(false);
  };

  const handleRestart = () => {
    cancelPendingNavigation();
    const nowMs = Date.now();
    const nextBottomColor = Math.random() < 0.5 ? "white" : "black";
    setHistory([createInitialBoard()]);
    setMoves([]);
    setClockHistory([initialClocks]);
    setClockSnapshot(initialClocks);
    setClockTickMs(nowMs);
    clockAnchorRef.current = null;
    setHistoryIndex(0);
    setIsPaused(true);
    setBottomColorAtStart(nextBottomColor);
    setTransitionMove(null);
    setShouldAnimateReset(true);
    setIsPopupDismissed(false);
  };

  const handleTogglePause = () => {
    cancelPendingNavigation();
    setShouldAnimateReset(false);

    if (isPaused) {
      const nowMs = Date.now();
      setClockTickMs(nowMs);
      clockAnchorRef.current = nowMs;
      setIsPaused(false);
      return;
    }

    const nowMs = Date.now();
    const pausedClockSnapshot = getCurrentDisplayedClockSnapshot(nowMs);
    setClockSnapshot(pausedClockSnapshot);
    setClockTickMs(nowMs);
    clockAnchorRef.current = null;
    setIsPaused(true);
  };

  const handleStepBack = () => {
    const currentHistoryIndex = pendingHistoryIndexRef.current ?? historyIndex;
    if (currentHistoryIndex === 0) return;

    const move = moves[currentHistoryIndex - 1];
    setShouldAnimateReset(false);
    setIsPopupDismissed(false);
    scheduleHistoryNavigation(currentHistoryIndex - 1, {
      from: move.to,
      to: move.from,
    });
  };

  const handleStepForward = () => {
    const currentHistoryIndex = pendingHistoryIndexRef.current ?? historyIndex;
    if (currentHistoryIndex >= history.length - 1) return;

    setShouldAnimateReset(false);
    setIsPopupDismissed(false);
    scheduleHistoryNavigation(
      currentHistoryIndex + 1,
      moves[currentHistoryIndex],
    );
  };

  const handleJumpToCurrentPosition = () => {
    const currentHistoryIndex = pendingHistoryIndexRef.current ?? historyIndex;
    if (currentHistoryIndex >= history.length - 1) return;

    scheduleResetNavigation(history.length - 1);
    setIsPopupDismissed(false);
  };

  const handleToggleFlipMode = () => {
    setFlipMode((previousMode) =>
      previousMode === "flip-lock" ? "flip" : "flip-lock"
    );
  };

  return (
    <>
      <Game
        gameState={gameState}
        prevMove={displayedMove}
        transitionMove={transitionMove}
        shouldAnimateReset={shouldAnimateReset}
        topColor={topColor}
        bottomColor={bottomColor}
        boardRotated={boardRotated}
        pieceRotations={pieceRotations}
        topPlayerRotated={topPlayerRotated}
        bottomPlayerRotated={bottomPlayerRotated}
        onMoveAttempt={handleMoveAttempt}
        controls={
          <ActionsBar
            actions={[
              {
                iconSrc: replayIcon,
                label: "Restart",
                onClick: handleRestart,
              },
              {
                iconSrc: flipMode === "flip-lock" ? flipLockIcon : flipIcon,
                label: flipMode === "flip-lock" ? "Flip lock" : "Flip",
                onClick: handleToggleFlipMode,
              },
              {
                iconSrc: isPaused ? playIcon : pauseIcon,
                label: isPaused ? "Resume" : "Pause",
                onClick: handleTogglePause,
              },
              {
                iconSrc: backIcon,
                label: "Back",
                onClick: handleStepBack,
                disabled: historyIndex === 0,
              },
              {
                iconSrc: nextIcon,
                label: "Next",
                onClick: handleStepForward,
                disabled: isViewingCurrentPosition,
              },
              {
                iconSrc: currentPositionIcon,
                label: "Back to current position",
                onClick: handleJumpToCurrentPosition,
                disabled: isViewingCurrentPosition,
              },
            ]}
          />
        }
        players={{
          black: {
            name: "Black",
            clock: formatClock(displayedClocks.black),
            imageSrc: blackProfileImage,
          },
          white: {
            name: "White",
            clock: formatClock(displayedClocks.white),
            imageSrc: whiteProfileImage,
          },
        }}
      />

      {shouldShowPopup && gameOutcome
        ? (
          <Popup
            title={gameOutcome.title}
            onClose={() => setIsPopupDismissed(true)}
            actions={
              <button
                type="button"
                className="popup__button"
                onClick={handleRestart}
              >
                Restart
              </button>
            }
          >
            <p className="popup__description">{gameOutcome.detail}</p>
          </Popup>
        )
        : null}
    </>
  );
}

export default LocalGame;
