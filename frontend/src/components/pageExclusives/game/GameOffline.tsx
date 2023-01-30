import { Box, Divider, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import ButtonsBannerOffline from "frontend/src/components/pageExclusives/game/GameOffline/ButtonsBannerOffline";
import PlayerBanner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import FormatBanner from "frontend/src/components/pageExclusives/game/FormatBanner";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef, useState } from "react";
import { pointsToAction, turnsToColor } from "shared/tools/board";
import { getGameStatus, generateStart, startAndTurnsToBoardLayout, step, pointToIndex, promote, getCapturedCountsWithoutPawns } from "shared/tools/boardLayout";
import { boardLayoutToRep } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { DrawReason, GameData, GameStatus, GameStatusCatagory, Point, Timeframe, WinReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import { MenuOffline } from "frontend/src/components/pageExclusives/game/GameOffline/MenuOffline";
import { getOppositeColor } from "shared/tools/piece";
import { THEME, WINDOW_WIDTH } from "frontend/src/pages/_app";
import { FLIP_PIECES_COOKIE } from "frontend/src/utils/tools/cookies";

export default function GameOffline(props: { timeframe: Timeframe }) {
  const { timeframe } = props;

  const isWide = WINDOW_WIDTH > 600;

  const [game, setGame] = useState<GameData>(getNewGame());
  const layout = new Stateful(startAndTurnsToBoardLayout(game.start, game.turns));
  const isMenuOpen = new Stateful<boolean>(false);
  const isFlipped = new Stateful(Math.random() < 0.5);
  const flipPieces = new Stateful(getFlipPiecesOrFallbackAndAssign());
  const stepsBack = new Stateful(0);
  const stepsBackTrigger = new Stateful(false);
  const isPaused = new Stateful(false);
  const timeUnpausedMs = new Stateful(0);
  const isGameJustOverByTimeout = new Stateful(false);
  const hasTimedOut = new Stateful(false);

  const layoutRef = useRef<BoardLayout>(layout.value);
  const from = useRef<Point>({ x: 0, y: 0 });
  const to = useRef<Point>({ x: 0, y: 0 });
  const promotionType = useRef<PieceType | null>(null);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastStatus = useRef<GameStatus>({ catagory: GameStatusCatagory.Ongoing });

  const turnsLength = game.turns.length - stepsBack.value;
  const isWhiteTurn = turnsLength % 2 === 0;
  const isStatusOngoing = game.status.catagory === GameStatusCatagory.Ongoing;
  const isStatusTimeout = game.status.catagory === GameStatusCatagory.Win
    && game.status.reason === WinReason.Timeout;
  const isGameOver = !(isStatusOngoing || isStatusTimeout);

  handleGameStatusChange();
  handleStepsBackTriggerChange();
  handleStepsBackOrTurnsOrIsPausedChange();

  return <>
    <Layout>
      {isWide ? getWideLayout() : getNarrowLayout()}
    </Layout>
    {getMenuOffline()}
  </>;

  function getNewGame(): GameData {
    const start = generateStart();

    return {
      timeframe: timeframe,
      isRated: false,
      start: start,
      timeLastTurnMs: new Date().getTime(),
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
      turns: [],
      status: { catagory: GameStatusCatagory.Ongoing }
    };
  }

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
    const timeCrntTurnMs = new Date().getTime();

    const newTimeLeftMs = game.timeframe === "untimed" ? 0 :
      turnsLength >= 2 ?
        (
          isGameJustOverByTimeout.value ? 0 :
          game.turns[turnsLength - 2].timeLeftMs + (
            hasTimedOut.value ? 0 :
            - (timeCrntTurnMs - game.timeLastTurnMs)
            + game.timeframe.incSec * 1000
          )
        ) : game.timeframe.overallSec * 1000;

    const newTurns = [
      ...game.turns.slice(0, game.turns.length - stepsBack.value),
      {
        action: pointsToAction(from.current, to.current),
        timeLeftMs: newTimeLeftMs,
        promotionType: promotionType.current,
        rep: boardLayoutToRep(layoutRef.current),
      }
    ];

    const newStatus = getGameStatus(
      layoutRef.current,
      getOppositeColor(turnsToColor(newTurns)),
      newTurns,
      game.startRep
    );

    lastStatus.current = newStatus;

    setGame({
      ...game,
      turns: newTurns,
      status: newStatus,
      timeLastTurnMs: timeCrntTurnMs
    });

    stepsBack.set(0);
    isPaused.set(false);
    timeUnpausedMs.set(0);

    promotionType.current = null;
  }

  function handleStartANewGame() {
    const newGame = getNewGame();
    setGame(newGame);
    layout.set(startAndTurnsToBoardLayout(newGame.start, newGame.turns));
    isFlipped.set(Math.random() < 0.5);
    stepsBack.set(0);
    hasTimedOut.set(false);
    isPaused.set(false);
    timeUnpausedMs.set(0);
  }

  function handleGameStatusChange() {
    useEffect(() => {
      if (
        !(isStatusOngoing || isStatusTimeout)
        || (isStatusTimeout && !hasTimedOut.value)
      ) {
        isMenuOpen.set(true);
      }

      if (isStatusTimeout) {
        hasTimedOut.set(true);
      } else {
        isGameJustOverByTimeout.set(false);
      }

    }, [game.status]);
  }

  function handleStepsBackTriggerChange() {
    useEffect(() => {
      layout.set(startAndTurnsToBoardLayout(
        game.start,
        game.turns.slice(0, turnsLength)
      ));

      setGame({
        ...{
          ...game,
          timeLastTurnMs: new Date().getTime(),
          status: (
            stepsBack.value !== 0 ?
              { catagory: GameStatusCatagory.Ongoing } :
              lastStatus.current
          )
        }
      });

      isGameJustOverByTimeout.set(false);

    }, [stepsBackTrigger.value]);
  }

  function handleStepsBackOrTurnsOrIsPausedChange() {
    useEffect(() => {
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
      }

      if (
        turnsLength >= 2 &&
        !hasTimedOut.value &&
        !isGameOver &&
        !isPaused.value &&
        game.timeframe !== "untimed"
      ) {
        timeoutId.current = setTimeout(() => {
          setGame((game) => ({
            ...game,
            status: {
              catagory: GameStatusCatagory.Win,
              winColor: getOppositeColor(turnsToColor(game.turns)),
              reason: WinReason.Timeout,
            },
            timeLastTurnMs: new Date().getTime()
          }));
          isGameJustOverByTimeout.set(true);
        }, game.turns[turnsLength - 2].timeLeftMs - timeUnpausedMs.value);
      }

    }, [stepsBack.value, game.turns, isPaused.value]);
  }

  function getFormatBanner() {
    return <FormatBanner
      timeframe={game.timeframe}
      isRated={null}
      isWide={isWide}
    />;
  }

  function getPlayerBanner(isWhite: boolean, isOnTop: boolean) {
    return <PlayerBanner key={Number(isOnTop)}
      name={isWhite ? 'White' : 'Black'}
      rating={null}
      timeLeftMs={getTimeLeft()}
      isTicking={getIsTicking()}
      initDateTimeMs={game.timeLastTurnMs}
      color={isWhite ? PieceColor.White : PieceColor.Black}
      isOnTop={isOnTop}
      isWide={isWide}
      isUntimed={game.timeframe === "untimed"}
      layout={layout.value}
    />;

    function getTimeLeft() {
      if (game.timeframe === "untimed") return 0;

      if (isGameJustOverByTimeout.value &&
        game.status.catagory === GameStatusCatagory.Win &&
        game.status.winColor === PieceColor.White !== isWhite
      ) {
        return 0;
      }

      if (turnsLength <= 1) {
        return game.timeframe.overallSec * 1000;
      }

      const [iMod, timeMod] = isWhiteTurn === isWhite ?
        [-1, -timeUnpausedMs.value] : [0, 0];
      return game.turns[turnsLength - 1 + iMod].timeLeftMs + timeMod;
    }

    function getIsTicking() {
      return isWhite === isWhiteTurn &&
        turnsLength > (isWhite ? 1 : 2) &&
        game.status.catagory === GameStatusCatagory.Ongoing &&
        !hasTimedOut.value &&
        !isGameOver &&
        !isPaused.value
    }
  }

  function getBoard() {
    return <Board
      enabled={!isGameOver}
      layout={layout.value}
      turnColor={isWhiteTurn ? PieceColor.White : PieceColor.Black}
      isFlipped={isFlipped.value}
      flipPieces={
        isWhiteTurn === isFlipped.value &&
        flipPieces.value
      }
      onMove={onMove}
      onPromotion={onPromotion}
      onTurnEnd={onTurnEnd}
    />;
  }

  function getButtonsBanner() {
    return <ButtonsBannerOffline
      canStepBack={stepsBack.value < game.turns.length}
      canStepForward={stepsBack.value > 0}
      isPaused={isPaused.value}
      isUntimed={game.timeframe === "untimed"}
      onMenuClick={() => isMenuOpen.set(true)}
      onPauseClick={() => {
        const crntTimeMs = new Date().getTime();

        if (isPaused.value) {
          setGame(v => ({ ...v, timeLastTurnMs: crntTimeMs }));
        } else {
          timeUnpausedMs.set(v => v + crntTimeMs - game.timeLastTurnMs);
        }

        isPaused.set(v => !v);
      }}
      onBackClick={() => { stepsBack.set(v => v + 1); stepsBackTrigger.set(v => !v); }}
      onForwardClick={() => { stepsBack.set(v => v - 1); stepsBackTrigger.set(v => !v); }}
    />;
  }

  function getMenuOffline() {
    return <MenuOffline
      isOpen={isMenuOpen}
      status={game.status}
      isFlipped={flipPieces}
      onStartANewGame={handleStartANewGame}
    />
  }

  function getNarrowLayout() {
    return <Box sx={{ margin: `auto` }}>
      <Box sx={{ padding: `7px` }} />
      {getFormatBanner()}
      {getPlayerBanner(isFlipped.value, true)}
      {getBoard()}
      {getPlayerBanner(!isFlipped.value, false)}
      {getButtonsBanner()}
      <Box sx={{ padding: `5px` }} />
    </Box>
  }

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
          {getPlayerBanner(isFlipped.value, true)}
          <Divider variant="middle" />
          {getPlayerBanner(!isFlipped.value, false)}
          <Box sx={{ padding: `5px` }} />
          {getButtonsBanner()}
        </Box>
      </Box>
    </Box>
  }

  function getFlipPiecesOrFallbackAndAssign() {
    const value = FLIP_PIECES_COOKIE.get();

    if (value !== undefined) return value;

    const fallback = !isWide;

    FLIP_PIECES_COOKIE.set(fallback);

    return fallback;
  }
}