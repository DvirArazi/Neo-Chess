import { Alert, Box, Divider, Modal, Portal, Snackbar, SnackbarCloseReason } from "@mui/material";
import AlertSnackbar from "frontend/src/components/AlertSnackbar";
import { VXButtons } from "frontend/src/components/Layout/TopBar/SignedInRow/ModalStuff";
import Board from "frontend/src/components/pageExclusives/game/Board";
import FormatBanner from "frontend/src/components/pageExclusives/game/FormatBanner";
import ButtonsBannerOnline from "frontend/src/components/pageExclusives/game/GameOnline/ButtonsBannerOnline";
import { MenuOnline } from "frontend/src/components/pageExclusives/game/GameOnline/MenuOnline";
import PlayerBanner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import { SOCKET, THEME, WINDOW_WIDTH } from "frontend/src/pages/_app";
import { getAdvantage } from "frontend/src/utils/tools/general";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef, useState } from "react";
import { actionToIndexes } from "shared/tools/board";
import { pointToIndex, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { BoardLayout } from "shared/types/boardLayout";
import { GameStatusCatagory, GameStatus, GameTurn, GameViewData, Point, WinReason, EGameRole, DrawReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";

export default function GameOnline(props: { data: GameViewData }) {
  const { data } = props;

  const isWide = WINDOW_WIDTH > 600;

  const [game, setGame] = useState<GameViewData>(data);
  const layout = new Stateful<BoardLayout>(startAndTurnsToBoardLayout(game.start, game.turns));
  const isMenuOpen = new Stateful<boolean>(false);
  const stepsBack = new Stateful<number>(0);
  const postTurn = new Stateful<boolean>(false);
  const isSnackbarOpen = new Stateful(false);
  const snackbarData = useRef({ friendName: '', success: false });
  const isRequestSnackbarOpen = new Stateful(false);
  const isDrawOfferSnackbarOpen = new Stateful(false);
  const isDrawOfferedSnackbarOpen = new Stateful(false);
  const isTakebackSnackbarOpen = new Stateful(false);
  const isTakeback2SnackbarOpen = new Stateful(false);

  const layoutRef = useRef<BoardLayout>(layout.value);
  const from = useRef<Point>({ x: 0, y: 0 });
  const to = useRef<Point>({ x: 0, y: 0 });
  const promotionType = useRef<PieceType | null>(null);
  const isFlipped = game.role !== PieceColor.Black;

  const isWhiteTurn = game.turns.length % 2 === 0;
  const turnColor = isWhiteTurn ? PieceColor.White : PieceColor.Black;
  const isStatusOngoing = game.status.catagory === GameStatusCatagory.Ongoing;
  const advantage = getAdvantage(layout.value);

  handlePlayerMovedEvent();
  handleTimeoutEvent();
  handleResignedEvent();
  handleDrawOfferedEvent();
  handleDrawAcceptedEvent();
  handleTakebackRequestedEvent();
  handleTakebackAcceptedEvent();
  handleRatingsUpdatedEvent();
  handleStepsBackChange();

  return <>
    {isWide ? getWideLayout() : getNarrowLayout()}
    {getMenu()}
    {getSnackbar()}
    {getRequestSnackbar()}
    {getDrawOfferSnackbar()}
    {getDrawOfferedSnackbar()}
    {getTakebackSnackbar()}
    {getTakebackRequestedSnackbar()}
  </>;

  function getWideLayout() {
    return <Box sx={{
      display: `flex`,
      flexDirection: `row`,
      justifyContent: `center`,
      maxWidth: `1000px`,
      margin: `auto`,
      padding: `10px`,
    }}>
      <Box sx={{
        flexBasis: `500px`,
        boxShadow: `0px 8px 15px 2px rgba(0,0,0,0.3)`,
        margin: `10px`,
        borderRadius: `7px`,
        overflow: `hidden`,
      }}>
        {getBoard()}
      </Box>

      <Box sx={{
        flex: `1`,

        margin: `10px`,
        maxWidth: `250px`,

        display: `flex`,
        flexDirection: `column`,
        justifyContent: `center`,
      }}>
        <Box sx={{
          borderRadius: `7px`,
          padding: `10px 0`,

          background: THEME.boxBackground,
          boxShadow: `0px 8px 15px -1px rgba(0,0,0,0.2)`,
        }}>
          {getFormatBanner()}
          <Box sx={{ padding: `5px` }} />
          {getPlayerBanner(!isFlipped, true)}
          <Divider variant="middle" />
          {getPlayerBanner(isFlipped, false)}
          <Box sx={{ padding: `5px` }} />
          {getButtonsBanner()}
        </Box>
      </Box>
    </Box>
  }

  function getNarrowLayout() {
    return <>
      <Box sx={{ paddingTop: `5px` }}></Box>
      {getFormatBanner()}
      {getPlayerBanner(!isFlipped, true)}
      {getBoard()}
      {getPlayerBanner(isFlipped, false)}
      {getButtonsBanner()}
    </>
  }

  function getBoard() {
    const prevMove = game.turns.length - 1 < 0 ? null :
      actionToIndexes(game.turns[game.turns.length - 1].action);

    return <Board
      enabled={
        isStatusOngoing &&
        game.role === turnColor &&
        stepsBack.value === 0
      }
      layout={layout.value}
      turnColor={turnColor}
      prevMove={prevMove}
      onMove={onMove}
      onPromotion={onPromotion}
      onTurnEnd={onTurnEnd}
      isFlipped={game.role === PieceColor.Black}
      flipPieces={false}
    />;

    function onMove(newFrom: Point, newTo: Point, newLayout: BoardLayout) {
      layout.set(newLayout);
      layoutRef.current = newLayout;
      from.current = newFrom;
      to.current = newTo;
    }

    function onPromotion(newPromotionType: PieceType) {
      const toI = pointToIndex(to.current);

      layoutRef.current[toI]!.type = newPromotionType;
      layout.set(layoutRef.current);
      promotionType.current = newPromotionType;
    }

    function onTurnEnd() {
      SOCKET.emit("playerMove", game.id,
        from.current,
        to.current,
        promotionType.current
      );

      postTurn.set(true);
    }
  }

  function getFormatBanner() {
    return <FormatBanner
      isRated={game.isRated}
      isWide={isWide}
      timeframe={game.timeframe}
    />
  }

  function getPlayerBanner(isWhite: boolean, isOnTop: boolean) {
    const player = isWhite ? game.white : game.black;

    return <PlayerBanner key={Number(isOnTop)}
      name={player.name}
      rating={player.rating}
      ratingMod={player.ratingMod}
      timeLeftMs={getTimeLeft()}
      isTicking={isTicking()}
      initDateTimeMs={game.timeLastTurnMs}
      color={isWhite ? PieceColor.White : PieceColor.Black}
      isOnTop={isOnTop}
      isWide={isWide}
      isUntimed={game.timeframe === "untimed"}
      layout={layout.value}
      advantage={advantage * (isWhite ? 1 : -1)}
      isFlipped={false}
    />;

    function getTimeLeft() {
      if (game.timeframe === "untimed") return 0;

      if (
        game.status.catagory === GameStatusCatagory.Win &&
        game.status.reason === WinReason.Timeout &&
        game.status.winColor === PieceColor.White !== isWhite
      ) {
        return 0;
      }

      if (game.turns.length <= 1) {
        return game.timeframe.overallSec * 1000;
      }

      const iMod = (game.turns.length % 2 === 0) === isWhite ? -1 : 0;

      if (!isStatusOngoing) {
        const crntI = game.turns.length - 1 - stepsBack.value
          + (((game.turns.length - stepsBack.value) % 2 === 0) === isWhite ? -1 : 0);
        return crntI <= 0 ? game.timeframe.overallSec * 1000 : game.turns[crntI].timeLeftMs;
      }

      const timeMod = !(postTurn.value && isWhiteTurn === isWhite) ? 0 :
        - (new Date().getTime() - game.timeLastTurnMs)
        + game.timeframe.incSec * 1000;

      return game.turns[game.turns.length - 1 + iMod].timeLeftMs + timeMod;
    }

    function isTicking() {
      return game.turns.length >= 2 &&
        isWhite === isWhiteTurn &&
        !postTurn.value &&
        isStatusOngoing;
    }
  }

  function getButtonsBanner() {
    return <ButtonsBannerOnline
      canStepBack={stepsBack.value < game.turns.length}
      canStepForward={stepsBack.value > 0}
      isViewer={game.role === EGameRole.Viewer}
      onBackClick={() => stepsBack.set(v => v + 1)}
      onForwardClick={() => stepsBack.set(v => v - 1)}
      onMenuClick={() => isMenuOpen.set(true)}
    />;
  }

  function getMenu() {
    return <MenuOnline
      isOpen={isMenuOpen}
      status={game.status}
      isTakebackEnabled={game.turns.length > (game.role === PieceColor.White ? 0 : 1)}
      onTakebackClick={() => {
        SOCKET.emit("takebackRequest", game.id);
        isTakebackSnackbarOpen.set(true);
      }}
      onDrawClick={() => {
        SOCKET.emit("drawOffer", game.id);
        isDrawOfferSnackbarOpen.set(true);
      }}
      onResignClick={() => SOCKET.emit("resign", game.id)}
      onRematchClick={sendInvitation}
      onNewOpponentClick={() => {
        SOCKET.emit("createGameRequest", game.timeframe, game.isRated, -200, 200);
        isRequestSnackbarOpen.set(true);
      }}
    />

    function sendInvitation() {
      const friend = game.role === PieceColor.Black ? game.white : game.black;

      SOCKET.emit("sendGameInvitation",
        game.timeframe,
        game.isRated,
        friend.id,
        (sent) => {
          snackbarData.current = { friendName: friend.name, success: sent };
          isSnackbarOpen.set(true);
        }
      );
    }
  }

  function getSnackbar() {
    const { friendName, success } = snackbarData.current;

    return <AlertSnackbar
      isOpen={isSnackbarOpen}
      severity={success ? "success" : "error"}
      message={
        `Invitation to ${friendName} ${success ?
          'was sent successfully' : 'could not be sent'}`
      }
    />
  }

  function getRequestSnackbar() {
    return <AlertSnackbar
      isOpen={isRequestSnackbarOpen}
      severity={"info"}
      message={'Game request sent'}
    />
  }

  function getDrawOfferSnackbar() {
    return <AlertSnackbar
      isOpen={isDrawOfferSnackbarOpen}
      severity={"info"}
      message={'Draw offer sent'}
    />
  }

  function getDrawOfferedSnackbar() {
    return <Box sx={{ position: `relative` }}>
      <Portal>
        <Snackbar
          open={isDrawOfferedSnackbarOpen.value}
          onClose={(_, reason) => handleClose(reason)}
        >
          <Alert
            severity={"info"}
            sx={{ alignItems: `center` }}
          >
            <Box sx={{
              display: `flex`,
              alignItems: `center`,
            }}>
              <Box>{'Your opponent offers a draw'}</Box>
              <Box sx={{ width: `20px` }} />
              <VXButtons onClick={(isAccepted) => {
                if (isAccepted) {
                  SOCKET.emit("drawAccept", game.id);
                }
                isDrawOfferedSnackbarOpen.set(false);
              }} />
            </Box>
          </Alert>
        </Snackbar>
      </Portal>
    </Box>;

    function handleClose(reason: SnackbarCloseReason) {
      if (reason === "clickaway") return;

      isDrawOfferedSnackbarOpen.set(false);
    }
  }

  function getTakebackSnackbar() {
    return <AlertSnackbar
      isOpen={isDrawOfferSnackbarOpen}
      severity={"info"}
      message={'Takeback request sent'}
    />
  }

  function getTakebackRequestedSnackbar() {
    return <Box sx={{ position: `relative` }}>
      <Portal>
        <Snackbar
          open={isTakeback2SnackbarOpen.value}
          onClose={(_, reason) => handleClose(reason)}
        >
          <Alert
            severity={"info"}
            sx={{ alignItems: `center` }}
          >
            <Box sx={{
              display: `flex`,
              alignItems: `center`,
            }}>
              <Box>{'Your opponent requests a takeback'}</Box>
              <Box sx={{ width: `20px` }} />
              <VXButtons onClick={(isAccepted) => {
                if (isAccepted) {
                  SOCKET.emit("takebackAccept", game.id);
                }
                isTakeback2SnackbarOpen.set(false);;
              }} />
            </Box>
          </Alert>
        </Snackbar>
      </Portal>
    </Box>;

    function handleClose(reason: SnackbarCloseReason) {
      if (reason === "clickaway") return;

      isTakeback2SnackbarOpen.set(false);
    }
  }

  function handlePlayerMovedEvent() {
    useEffect(() => {
      SOCKET.on("playerMoved", (gameId, newTurn, newStatus, timeCrntTurnMs) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame(v => {
          const newTurns = v.turns.concat(newTurn);
          layout.set(startAndTurnsToBoardLayout(v.start, newTurns));

          return {
            ...v,
            turns: newTurns,
            status: newStatus,
            timeLastTurnMs: timeCrntTurnMs,
          };
        });

        if (newStatus.catagory !== GameStatusCatagory.Ongoing) {
          isMenuOpen.set(true);
        }

        stepsBack.set(0);
        postTurn.set(false);
        isDrawOfferedSnackbarOpen.set(false);
        isTakeback2SnackbarOpen.set(false);

        promotionType.current = null;
      });
    }, []);
  }

  function handleTimeoutEvent() {
    useEffect(() => {
      SOCKET.on("timeout", (gameId, winColor) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame(v => ({
          ...v,
          status: {
            catagory: GameStatusCatagory.Win,
            winColor: winColor,
            reason: WinReason.Timeout,
          }
        }));

        stepsBack.set(0);
        isMenuOpen.set(true);
      });
    }, []);
  }

  function handleResignedEvent() {
    useEffect(() => {
      SOCKET.on("resigned", (gameId, winColor) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame(v => ({
          ...v,
          status: {
            catagory: GameStatusCatagory.Win,
            winColor: winColor,
            reason: WinReason.Resignation,
          }
        }));

        stepsBack.set(0);
        isMenuOpen.set(true);
      });
    }, []);
  }

  function handleDrawOfferedEvent() {
    useEffect(() => {
      SOCKET.on("drawOffered", (gameId) => {
        if (game.id.toString() !== gameId.toString()) return;

        isDrawOfferedSnackbarOpen.set(true);
      });
    }, []);
  }

  function handleDrawAcceptedEvent() {
    useEffect(() => {
      SOCKET.on("drawAccepted", (gameId) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame(v => ({
          ...v,
          status: {
            catagory: GameStatusCatagory.Draw,
            reason: DrawReason.Agreement,
          }
        }));

        stepsBack.set(0);
        isMenuOpen.set(true);
      });
    }, []);
  }

  function handleTakebackRequestedEvent() {
    useEffect(() => {
      SOCKET.on("takebackRequested", (gameId) => {
        if (game.id.toString() !== gameId.toString()) return;

        isTakeback2SnackbarOpen.set(true);
      });
    }, []);
  }

  function handleTakebackAcceptedEvent() {
    useEffect(() => {
      SOCKET.on("takebackAccepted", (gameId, toTurn, timeCrntTurnMs) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame(v => {
          const newTurns = v.turns.slice(0, toTurn);
          layout.set(startAndTurnsToBoardLayout(v.start, newTurns));

          return ({
            ...v,
            turns: newTurns,
            timeLastTurnMs: timeCrntTurnMs,
          })
        });

        stepsBack.set(0);

        promotionType.current = null;
      });
    }, []);
  }

  function handleRatingsUpdatedEvent() {
    useEffect(() => {
      SOCKET.on("ratingsUpdated", (gameId, newWhiteRating, newBlackRating) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame(v => ({
          ...v,
          white: { ...v.white, ratingMod: newWhiteRating - v.white.rating },
          black: { ...v.black, ratingMod: newBlackRating - v.black.rating }
        }))
      });
    }, []);
  }

  function handleStepsBackChange() {
    useEffect(() => {
      layout.set(startAndTurnsToBoardLayout(
        game.start,
        game.turns.slice(0, game.turns.length - stepsBack.value)
      ));

    }, [stepsBack.value]);
  }
}

