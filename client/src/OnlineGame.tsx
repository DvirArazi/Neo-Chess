import { useEffect, useRef, useState } from "react";
import type { AuthenticatedUser, OnlineGameState } from "../../shared/socket";
import type { MoveInput, PieceColor } from "./chess/types";
import { ActionsBar } from "./ActionsBar";
import { Game } from "./Game";
import { Popup } from "./Popup";
import { socket } from "./socket";
import { LOCAL_TIME_CONTROLS, formatClock } from "./timeControls";
import { useMediaQuery } from "./useMediaQuery";
import whiteProfileImage from "./assets/images/localProfile/white.png";
import blackProfileImage from "./assets/images/localProfile/black.png";
import backIcon from "./assets/images/backwards.svg";
import nextIcon from "./assets/images/forwards.svg";
import currentPositionIcon from "./assets/images/double_forwards.svg";
import flagIcon from "./assets/images/flag.svg";
import drawIcon from "./assets/images/handshake.svg";

type OnlineGameProps = {
  gameId: string;
  authenticatedUser: AuthenticatedUser | null;
};

function oppositeColor(color: PieceColor): PieceColor {
  return color === "white" ? "black" : "white";
}

function getPlayerColor(
  game: OnlineGameState,
  userId: string,
): PieceColor | null {
  if (game.players.white.id === userId) return "white";
  if (game.players.black.id === userId) return "black";
  return null;
}

function formatStatus(game: OnlineGameState): string | null {
  if (game.status.type === "active") return null;
  if (game.status.type === "draw") return "Draw";

  return `${game.players[game.status.winner].username} wins by resignation`;
}

function getGameOutcome(game: OnlineGameState): {
  title: string;
  detail: string;
} | null {
  if (game.status.type === "active") return null;
  if (game.status.type === "draw") {
    return {
      title: "Draw",
      detail: "The game ended by agreement.",
    };
  }

  return {
    title: `${game.players[game.status.winner].username} wins`,
    detail: "Reason: resignation.",
  };
}

export function OnlineGame(props: OnlineGameProps) {
  const isDesktopLayout = useMediaQuery("(min-width: 600px)");
  const [game, setGame] = useState<OnlineGameState | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [transitionMove, setTransitionMove] = useState<MoveInput | null>(null);
  const [shouldAnimateReset, setShouldAnimateReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isResignPopupOpen, setIsResignPopupOpen] = useState(false);
  const [isDrawPopupOpen, setIsDrawPopupOpen] = useState(false);
  const [isEndGamePopupDismissed, setIsEndGamePopupDismissed] = useState(false);
  const [desktopBottomColor, setDesktopBottomColor] = useState<PieceColor>(() =>
    Math.random() < 0.5 ? "white" : "black"
  );
  const historyIndexRef = useRef(0);
  const historyLengthRef = useRef(0);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    const handleGameUpdated = (nextGame: OnlineGameState) => {
      if (nextGame.id !== props.gameId) return;

      const previousHistoryLength = historyLengthRef.current;
      const nextHistoryLength = nextGame.history.length;
      const hasNewMove = previousHistoryLength > 0 &&
        nextHistoryLength > previousHistoryLength;
      const wasViewingCurrent = historyIndexRef.current >=
        Math.max(0, previousHistoryLength - 1);
      historyLengthRef.current = nextHistoryLength;
      setGame(nextGame);
      setStatusMessage(null);
      if (nextGame.status.type !== "active") {
        setIsResignPopupOpen(false);
        setIsDrawPopupOpen(false);
        setIsEndGamePopupDismissed(false);
      }

      if (wasViewingCurrent) {
        setHistoryIndex(nextHistoryLength - 1);
        setTransitionMove(
          hasNewMove ? nextGame.moves[nextGame.moves.length - 1] ?? null : null,
        );
        setShouldAnimateReset(false);
      }
    };

    socket.on("onlineGameUpdated", handleGameUpdated);
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("getOnlineGame", { gameId: props.gameId }, (response) => {
      if (!response.ok) {
        setStatusMessage(response.error);
        return;
      }

      historyLengthRef.current = response.game.history.length;
      setGame(response.game);
      setHistoryIndex(response.game.history.length - 1);
      setTransitionMove(null);
      setShouldAnimateReset(true);
    });

    return () => {
      socket.off("onlineGameUpdated", handleGameUpdated);
    };
  }, [props.gameId]);

  useEffect(() => {
    setIsResignPopupOpen(false);
    setIsDrawPopupOpen(false);
    setIsEndGamePopupDismissed(false);
    setDesktopBottomColor(Math.random() < 0.5 ? "white" : "black");
  }, [props.gameId]);

  if (!props.authenticatedUser) {
    return (
      <main className="home-page">
        <section className="home-page__panel">
          <h1 className="home-page__title">Online Game</h1>
          <p className="home-page__message">Log in to view this game.</p>
        </section>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="home-page">
        <section className="home-page__panel">
          <h1 className="home-page__title">Online Game</h1>
          <p className="home-page__message">
            {statusMessage ?? "Loading game..."}
          </p>
        </section>
      </main>
    );
  }

  const playerColor = getPlayerColor(game, props.authenticatedUser.id);
  if (!playerColor) {
    return (
      <main className="home-page">
        <section className="home-page__panel">
          <h1 className="home-page__title">Online Game</h1>
          <p className="home-page__message">You are not a player in this game.</p>
        </section>
      </main>
    );
  }

  const displayedState = game.history[historyIndex] ?? game.state;
  const isViewingCurrentPosition = historyIndex === game.history.length - 1;
  const displayedMove = historyIndex > 0
    ? game.moves[historyIndex - 1] ?? null
    : null;
  const bottomColor = isDesktopLayout ? desktopBottomColor : playerColor;
  const topColor = oppositeColor(bottomColor);
  const boardRotated = bottomColor === "black";
  const gameStatus = formatStatus(game);
  const gameOutcome = getGameOutcome(game);
  const timeControl = LOCAL_TIME_CONTROLS.find((control) =>
    control.id === game.timeControlId
  ) ?? LOCAL_TIME_CONTROLS.find((control) => control.id === "unlimited");
  const clockLabel = formatClock(
    timeControl?.initialMs ?? Number.POSITIVE_INFINITY,
  );
  const hasIncomingDrawOffer =
    game.status.type === "active" &&
    game.drawOffer !== undefined &&
    game.drawOffer.offeredBy !== playerColor;
  const drawOfferOpponent = hasIncomingDrawOffer && game.drawOffer
    ? game.players[game.drawOffer.offeredBy].username
    : "";

  const handleMoveAttempt = (move: MoveInput) => {
    if (!isViewingCurrentPosition || game.status.type !== "active") return;

    socket.emit("makeOnlineMove", { gameId: game.id, move }, (response) => {
      if (!response.ok) {
        setStatusMessage(response.error);
      }
    });
  };

  const handleStepBack = () => {
    if (historyIndex === 0) return;

    const move = game.moves[historyIndex - 1];
    setShouldAnimateReset(false);
    setTransitionMove(move ? { from: move.to, to: move.from } : null);
    setHistoryIndex((current) => Math.max(0, current - 1));
  };

  const handleStepForward = () => {
    if (isViewingCurrentPosition) return;

    setShouldAnimateReset(false);
    setTransitionMove(game.moves[historyIndex] ?? null);
    setHistoryIndex((current) =>
      Math.min(game.history.length - 1, current + 1)
    );
  };

  const handleJumpToCurrentPosition = () => {
    if (isViewingCurrentPosition) return;

    setShouldAnimateReset(true);
    setTransitionMove(null);
    setHistoryIndex(game.history.length - 1);
  };

  const handleResign = () => {
    setIsResignPopupOpen(true);
  };

  const handleConfirmResign = () => {
    socket.emit("resignOnlineGame", { gameId: game.id }, (response) => {
      if (!response.ok) {
        setStatusMessage(response.error);
        return;
      }

      setIsResignPopupOpen(false);
    });
  };

  const handleDraw = () => {
    setIsDrawPopupOpen(true);
  };

  const handleConfirmDrawOffer = () => {
    socket.emit("offerOnlineDraw", { gameId: game.id }, (response) => {
      if (!response.ok) {
        setStatusMessage(response.error);
        return;
      }

      setIsDrawPopupOpen(false);
    });
  };

  const handleDrawResponse = (accepted: boolean) => {
    socket.emit(
      "respondOnlineDrawOffer",
      { gameId: game.id, accepted },
      (response) => {
        if (!response.ok) {
          setStatusMessage(response.error);
        }
      },
    );
  };

  return (
    <>
      {statusMessage || gameStatus
        ? (
          <div className="online-game__status" role="status">
            {statusMessage ?? gameStatus}
          </div>
        )
        : null}
      <Game
        gameState={displayedState}
        prevMove={displayedMove}
        transitionMove={transitionMove}
        shouldAnimateReset={shouldAnimateReset}
        topColor={topColor}
        bottomColor={bottomColor}
        boardRotated={boardRotated}
        pieceRotations={{
          black: boardRotated,
          white: boardRotated,
        }}
        topPlayerRotated={false}
        bottomPlayerRotated={false}
        movableColor={isViewingCurrentPosition && game.status.type === "active"
          ? playerColor
          : null}
        onMoveAttempt={handleMoveAttempt}
        controls={
          <ActionsBar
            actions={[
              {
                iconSrc: flagIcon,
                label: "Resign",
                onClick: handleResign,
                disabled: game.status.type !== "active",
              },
              {
                iconSrc: drawIcon,
                label: "Draw",
                onClick: handleDraw,
                disabled: game.status.type !== "active",
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
            name: game.players.black.username,
            clock: clockLabel,
            imageSrc: blackProfileImage,
          },
          white: {
            name: game.players.white.username,
            clock: clockLabel,
            imageSrc: whiteProfileImage,
          },
        }}
        bottomPlayerAddon={hasIncomingDrawOffer
          ? (
            <div className="online-game__draw-offer" role="status">
              <span className="online-game__draw-offer-text">
                {drawOfferOpponent} offers a draw.
              </span>
              <div className="online-game__draw-offer-actions">
                <button
                  type="button"
                  className="online-game__draw-offer-button"
                  onClick={() => handleDrawResponse(false)}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="online-game__draw-offer-button online-game__draw-offer-button--accept"
                  onClick={() => handleDrawResponse(true)}
                >
                  Accept
                </button>
              </div>
            </div>
          )
          : null}
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
        title="Offer draw?"
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
              onClick={handleConfirmDrawOffer}
            >
              Yes
            </button>
          </>
        }
      >
        <p className="popup__description">
          Are you sure you want to offer a draw?
        </p>
      </Popup>
      <Popup
        open={Boolean(gameOutcome) && !isEndGamePopupDismissed}
        title={gameOutcome?.title ?? ""}
        onClose={() => setIsEndGamePopupDismissed(true)}
      >
        {gameOutcome
          ? <p className="popup__description">{gameOutcome.detail}</p>
          : null}
      </Popup>
    </>
  );
}
