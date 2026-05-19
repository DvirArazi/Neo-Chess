import { useEffect, useRef, useState } from "react";
import { createInitialBoard } from "../../shared/chess/setup";
import type { AuthenticatedUser } from "../../shared/socket";
import type { GameState, MoveInput, PieceColor } from "./chess/types";
import {
  applyMove,
  getBoardGameOutcome,
} from "../../shared/chess/moveGeneration";
import { Game } from "./Game";
import { Popup } from "./Popup";
import { ActionsBar } from "./ActionsBar";
import { formatClock, type LocalTimeControl } from "./timeControls";
import {
  GUEST_LOCAL_GAME_USER_ID,
  type LocalGameClockSnapshot,
  type LocalGameRecord,
  type LocalGameStatus,
} from "./localGameStorage";
import { useMediaQuery } from "./useMediaQuery";
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
import swapIcon from "./assets/images/swap.svg";
import flagIcon from "./assets/images/flag.svg";
import drawIcon from "./assets/images/handshake.svg";

type ClockSnapshot = LocalGameClockSnapshot;

type GameOutcomeMessage = {
  title: string;
  detail: string;
};
type FlipMode = "flip" | "flip-lock";
type LocalGameProps = {
  timeControl: LocalTimeControl;
  authenticatedUser: AuthenticatedUser | null;
  requestedGameId?: string | null;
  savedGame?: LocalGameRecord | null;
  onLocalGameIdChange?: (gameId: string) => void;
  onLocalGameSnapshot?: (record: LocalGameRecord) => void;
};

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

function formatColorName(color: PieceColor): string {
  return color === "white" ? "White" : "Black";
}

function oppositeColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

function createLocalGameId(): string {
  return window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSavedManualGameStatus(
  status: LocalGameStatus | undefined,
): LocalGameStatus | null {
  if (!status) return null;
  if (status.type === "resignation") return status;
  if (status.type === "draw" && status.reason === "agreement") return status;

  return null;
}

function getLocalGameStatus(
  manualStatus: LocalGameStatus | null,
  clocks: ClockSnapshot,
  state: GameState,
  history: GameState[],
): LocalGameStatus {
  if (manualStatus) return manualStatus;

  if (Number.isFinite(clocks.white) && clocks.white === 0) {
    return {
      type: "timeout",
      winner: "black",
      loser: "white",
    };
  }

  if (Number.isFinite(clocks.black) && clocks.black === 0) {
    return {
      type: "timeout",
      winner: "white",
      loser: "black",
    };
  }

  const boardOutcome = getBoardGameOutcome(state, history);
  if (!boardOutcome) return { type: "active" };

  if (boardOutcome.result === "draw") {
    return {
      type: "draw",
      reason: boardOutcome.reason,
    };
  }

  return {
    type: "win",
    reason: boardOutcome.reason,
    winner: boardOutcome.winner,
    loser: oppositeColor(boardOutcome.winner),
  };
}

function getLocalGameStatusKey(status: LocalGameStatus): string {
  if (status.type === "active") return status.type;
  if (status.type === "draw") return `${status.type}:${status.reason}`;
  if (status.type === "win") {
    return `${status.type}:${status.reason}:${status.winner}:${status.loser}`;
  }

  return `${status.type}:${status.winner}:${status.loser}`;
}

function getLocalGameOutcomeMessage(
  status: LocalGameStatus,
): GameOutcomeMessage | null {
  if (status.type === "active") return null;

  if (status.type === "draw") {
    return {
      title: "Draw",
      detail: status.reason === "insufficient-material"
        ? "Only kings remain, so neither side has sufficient material to win."
        : status.reason === "stalemate"
        ? "Stalemate."
        : "The game ended by agreement.",
    };
  }

  if (status.type === "timeout") {
    return {
      title: `${formatColorName(status.winner)} wins`,
      detail: `${formatColorName(status.loser)} ran out of time`,
    };
  }

  if (status.type === "resignation") {
    return {
      title: `${formatColorName(status.winner)} wins`,
      detail: `${formatColorName(status.loser)} resigned.`,
    };
  }

  if (status.type === "checkmate") {
    return {
      title: `${formatColorName(status.winner)} wins`,
      detail: `${formatColorName(status.loser)} is checkmated.`,
    };
  }

  const winDetails = {
    checkmate: `${formatColorName(status.loser)} is checkmated.`,
    stalemate: `${formatColorName(status.winner)} wins by stalemate.`,
    "threefold-repetition":
      `${formatColorName(status.loser)} caused a threefold repetition.`,
  } as const;

  return {
    title: `${formatColorName(status.winner)} wins`,
    detail: winDetails[status.reason],
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

function LocalGame(props: LocalGameProps) {
  const isDesktopLayout = useMediaQuery("(min-width: 600px)");
  const initialClocks = createInitialClocks(props.timeControl.initialMs);
  const [localGameId, setLocalGameId] = useState(() =>
    props.savedGame?.id ?? props.requestedGameId ?? createLocalGameId()
  );
  const [localGameCreatedAt, setLocalGameCreatedAt] = useState(() =>
    props.savedGame?.createdAt ?? Date.now()
  );
  const [history, setHistory] = useState<GameState[]>(() =>
    props.savedGame && props.savedGame.history.length > 0
      ? props.savedGame.history
      : [createInitialBoard()]
  );
  const [moves, setMoves] = useState<MoveInput[]>(() =>
    props.savedGame?.moves ?? []
  );
  const [clockHistory, setClockHistory] = useState<ClockSnapshot[]>(() =>
    props.savedGame && props.savedGame.clockHistory.length > 0
      ? props.savedGame.clockHistory
      : [initialClocks]
  );
  const [clockSnapshot, setClockSnapshot] = useState<ClockSnapshot>(() =>
    props.savedGame?.clockSnapshot ?? initialClocks
  );
  const [clockTickMs, setClockTickMs] = useState(() => Date.now());
  const [historyIndex, setHistoryIndex] = useState(() =>
    props.savedGame && props.savedGame.history.length > 0
      ? props.savedGame.history.length - 1
      : 0
  );
  const [isPaused, setIsPaused] = useState(true);
  const [transitionMove, setTransitionMove] = useState<MoveInput | null>(null);
  const [shouldAnimateReset, setShouldAnimateReset] = useState(false);
  const [isPopupDismissed, setIsPopupDismissed] = useState(false);
  const [isResignPopupOpen, setIsResignPopupOpen] = useState(false);
  const [isDrawPopupOpen, setIsDrawPopupOpen] = useState(false);
  const [flipMode, setFlipMode] = useState<FlipMode>("flip-lock");
  const [bottomPlayerColor, setBottomPlayerColor] = useState<PieceColor>(() =>
    props.savedGame?.bottomPlayerColor ??
      (Math.random() < 0.5 ? "white" : "black")
  );
  const [hasPieRuleBeenUsed, setHasPieRuleBeenUsed] = useState(() =>
    props.savedGame?.hasPieRuleBeenUsed ?? false
  );
  const [manualGameStatus, setManualGameStatus] = useState<
    LocalGameStatus | null
  >(() => getSavedManualGameStatus(props.savedGame?.status));
  const pendingHistoryIndexRef = useRef<number | null>(null);
  const pendingNavigationFrameRef = useRef<number | null>(null);
  const clockAnchorRef = useRef<number | null>(null);
  const latestLocalGameRecordRef = useRef<LocalGameRecord | null>(null);

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
  const displayedLocalGameStatus = getLocalGameStatus(
    manualGameStatus,
    displayedClocks,
    gameState,
    history.slice(0, historyIndex + 1),
  );
  const gameOutcome = getLocalGameOutcomeMessage(displayedLocalGameStatus);
  const shouldShowPopup = Boolean(gameOutcome) && !isPopupDismissed;
  const canEndGameManually = isViewingCurrentPosition && !gameOutcome;
  const canUsePieRule =
    isViewingCurrentPosition &&
    !gameOutcome &&
    !hasPieRuleBeenUsed &&
    gameState.turn === "black" &&
    moves.length === 1 &&
    history.length === 2;
  const topColor: PieceColor = oppositeColor(bottomPlayerColor);
  const bottomColor: PieceColor = bottomPlayerColor;
  const boardRotated = bottomColor === "black";
  const isTopPlayersTurn = gameState.turn === topColor;
  const modePieceRotations: Record<PieceColor, boolean> = {
    black: isDesktopLayout
      ? boardRotated
      : flipMode === "flip"
      ? isTopPlayersTurn
      : topColor === "black",
    white: isDesktopLayout
      ? boardRotated
      : flipMode === "flip"
      ? isTopPlayersTurn
      : topColor === "white",
  };
  const pieceRotations: Record<PieceColor, boolean> = {
    black: isDesktopLayout
      ? boardRotated
      : boardRotated !== modePieceRotations.black,
    white: isDesktopLayout
      ? boardRotated
      : boardRotated !== modePieceRotations.white,
  };
  const topPlayerRotated = isDesktopLayout
    ? false
    : flipMode === "flip-lock" || isTopPlayersTurn;
  const bottomPlayerRotated = isDesktopLayout
    ? false
    : flipMode === "flip" && isTopPlayersTurn;
  const localGameStorageUserId = props.authenticatedUser?.id ??
    GUEST_LOCAL_GAME_USER_ID;
  const latestClockHistorySnapshot = clockHistory[clockHistory.length - 1] ??
    clockSnapshot;
  const savedClockSnapshot = isViewingCurrentPosition
    ? displayedClocks
    : latestClockHistorySnapshot;
  const savedGameState = history[history.length - 1] ?? gameState;
  const savedLocalGameStatus = getLocalGameStatus(
    manualGameStatus,
    savedClockSnapshot,
    savedGameState,
    history,
  );
  const savedLocalGameStatusKey = getLocalGameStatusKey(savedLocalGameStatus);

  latestLocalGameRecordRef.current = {
    id: localGameId,
    userId: localGameStorageUserId,
    timeControlId: props.timeControl.id,
    state: savedGameState,
    history,
    moves,
    clockHistory,
    clockSnapshot: savedClockSnapshot,
    bottomPlayerColor,
    hasPieRuleBeenUsed,
    status: savedLocalGameStatus,
    createdAt: localGameCreatedAt,
    updatedAt: Date.now(),
  };

  useEffect(() => {
    return () => {
      if (pendingNavigationFrameRef.current === null) return;
      cancelAnimationFrame(pendingNavigationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    props.onLocalGameIdChange?.(localGameId);
  }, [localGameId, props.onLocalGameIdChange]);

  useEffect(() => {
    const record = latestLocalGameRecordRef.current;
    if (!record || !props.onLocalGameSnapshot) return;

    props.onLocalGameSnapshot(record);
  }, [
    localGameStorageUserId,
    props.onLocalGameSnapshot,
    props.timeControl.id,
    localGameId,
    localGameCreatedAt,
    history,
    moves,
    clockHistory,
    clockSnapshot.black,
    clockSnapshot.white,
    bottomPlayerColor,
    hasPieRuleBeenUsed,
    isPaused,
    savedLocalGameStatusKey,
  ]);

  useEffect(() => {
    return () => {
      const record = latestLocalGameRecordRef.current;
      if (!record || !props.onLocalGameSnapshot) return;

      props.onLocalGameSnapshot(record);
    };
  }, [props.onLocalGameSnapshot]);

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
    setLocalGameId(createLocalGameId());
    setLocalGameCreatedAt(nowMs);
    setHistory([createInitialBoard()]);
    setMoves([]);
    setClockHistory([initialClocks]);
    setClockSnapshot(initialClocks);
    setClockTickMs(nowMs);
    clockAnchorRef.current = null;
    setHistoryIndex(0);
    setIsPaused(true);
    setBottomPlayerColor(nextBottomColor);
    setHasPieRuleBeenUsed(false);
    setManualGameStatus(null);
    setIsResignPopupOpen(false);
    setIsDrawPopupOpen(false);
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

  const handleUsePieRule = () => {
    if (!canUsePieRule) return;

    cancelPendingNavigation();
    setBottomPlayerColor((currentColor) => oppositeColor(currentColor));
    setHasPieRuleBeenUsed(true);
    setShouldAnimateReset(false);
    setIsPopupDismissed(false);
  };

  const endGameManually = (status: LocalGameStatus) => {
    if (!canEndGameManually) return;

    cancelPendingNavigation();
    const nowMs = Date.now();
    const finalClockSnapshot = getCurrentDisplayedClockSnapshot(nowMs);
    setClockSnapshot(finalClockSnapshot);
    setClockTickMs(nowMs);
    clockAnchorRef.current = null;
    setIsPaused(true);
    setManualGameStatus(status);
    setIsResignPopupOpen(false);
    setIsDrawPopupOpen(false);
    setShouldAnimateReset(false);
    setIsPopupDismissed(false);
  };

  const handleResign = () => {
    if (!canEndGameManually) return;

    setIsResignPopupOpen(true);
  };

  const handleConfirmResign = () => {
    endGameManually({
      type: "resignation",
      winner: oppositeColor(gameState.turn),
      loser: gameState.turn,
    });
  };

  const handleDraw = () => {
    if (!canEndGameManually) return;

    setIsDrawPopupOpen(true);
  };

  const handleConfirmDraw = () => {
    endGameManually({
      type: "draw",
      reason: "agreement",
    });
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
              ...(!isDesktopLayout
                ? [{
                  iconSrc: flipMode === "flip-lock" ? flipLockIcon : flipIcon,
                  label: flipMode === "flip-lock" ? "Flip lock" : "Flip",
                  onClick: handleToggleFlipMode,
                }]
                : []),
              {
                iconSrc: isPaused ? playIcon : pauseIcon,
                label: isPaused ? "Resume" : "Pause",
                onClick: handleTogglePause,
                disabled: Boolean(gameOutcome),
              },
              {
                iconSrc: flagIcon,
                label: "Resign",
                onClick: handleResign,
                disabled: !canEndGameManually,
              },
              {
                iconSrc: drawIcon,
                label: "Draw",
                onClick: handleDraw,
                disabled: !canEndGameManually,
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
            action: canUsePieRule
              ? (
                <button
                  type="button"
                  className="player-card__action-button"
                  aria-label="Swap sides"
                  title="Swap sides"
                  onClick={handleUsePieRule}
                >
                  <img
                    className="player-card__action-icon"
                    src={swapIcon}
                    alt=""
                  />
                </button>
              )
              : undefined,
          },
          white: {
            name: "White",
            clock: formatClock(displayedClocks.white),
            imageSrc: whiteProfileImage,
          },
        }}
      />

      <Popup
        open={isResignPopupOpen}
        title="Resign?"
        onClose={() => setIsResignPopupOpen(false)}
        closeOnBackdropPress={true}
        actions={
          <>
            <button
              type="button"
              className="popup__button popup__button--secondary"
              onClick={() => setIsResignPopupOpen(false)}
            >
              No
            </button>
            <button
              type="button"
              className="popup__button popup__button--danger"
              onClick={handleConfirmResign}
            >
              Yes
            </button>
          </>
        }
      >
        <p className="popup__description">Are you sure you want to resign?</p>
      </Popup>

      <Popup
        open={isDrawPopupOpen}
        title="Draw?"
        onClose={() => setIsDrawPopupOpen(false)}
        closeOnBackdropPress={true}
        actions={
          <>
            <button
              type="button"
              className="popup__button popup__button--secondary"
              onClick={() => setIsDrawPopupOpen(false)}
            >
              No
            </button>
            <button
              type="button"
              className="popup__button"
              onClick={handleConfirmDraw}
            >
              Yes
            </button>
          </>
        }
      >
        <p className="popup__description">
          End this local game as a draw?
        </p>
      </Popup>

      <Popup
        open={shouldShowPopup && Boolean(gameOutcome)}
        title={gameOutcome?.title ?? ""}
        onClose={() => setIsPopupDismissed(true)}
        actions={
          gameOutcome
            ? (
              <button
                type="button"
                className="popup__button"
                onClick={handleRestart}
              >
                Restart
              </button>
            )
            : undefined
        }
      >
        {gameOutcome
          ? <p className="popup__description">{gameOutcome.detail}</p>
          : null}
      </Popup>
    </>
  );
}

export default LocalGame;
