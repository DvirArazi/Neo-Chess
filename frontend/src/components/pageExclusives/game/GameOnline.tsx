import { Box, Divider, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import FormatBanner from "frontend/src/components/pageExclusives/game/FormatBanner";
import ButtonsBannerOnline from "frontend/src/components/pageExclusives/game/GameOnline/ButtonsBannerOnline";
import { MenuOnline } from "frontend/src/components/pageExclusives/game/GameOnline/MenuOnline";
import PlayerBanner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import { SOCKET, THEME, WINDOW_WIDTH } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef, useState } from "react";
import { pointsToAction, turnsToColor } from "shared/tools/board";
import { getGameStatus, pointToIndex, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { GameStatusCatagory, GameStatus, GameTurn, GameViewData, Point, WinReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";

export default function GameOnline(props: { data: GameViewData }) {
  const { data } = props;

  console.log('data', data)

  const isWide = WINDOW_WIDTH > 600;

  const [game, setGame] = useState<GameViewData>(data);
  const layout = new Stateful<BoardLayout>(startAndTurnsToBoardLayout(game.start, game.turns));
  const isMenuOpen = new Stateful<boolean>(false);
  const stepsBack = new Stateful<number>(0);
  const postTurn = new Stateful<boolean>(false);

  const layoutRef = useRef<BoardLayout>(layout.value);
  const from = useRef<Point>({ x: 0, y: 0 });
  const to = useRef<Point>({ x: 0, y: 0 });
  const promotionType = useRef<PieceType | null>(null);
  const isFlipped = game.role !== PieceColor.Black;

  const isWhiteTurn = game.turns.length % 2 === 0;
  const turnColor = isWhiteTurn ? PieceColor.White : PieceColor.Black;
  const isStatusOngoing = game.status.catagory === GameStatusCatagory.Ongoing;

  console.log(game.status);

  handlePlayerMovedEvent();
  handleTimeoutEvent();
  handleStepsBackChange();

  return <>
    {isWide ? getWideLayout() : getNarrowLayout()}
    {getMenu()}
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
      <Box sx={{paddingTop: `5px`}}></Box>
      {getFormatBanner()}
      {getPlayerBanner(!isFlipped, true)}
      {getBoard()}
      {getPlayerBanner(isFlipped, false)}
      {getButtonsBanner()}
    </>
  }

  function getBoard() {
    // console.log(isStatusOngoing, game.role, turnColor, stepsBack.value);

    return <Board
      enabled={
        isStatusOngoing &&
        game.role === turnColor &&
        stepsBack.value === 0
      }
      layout={layout.value}
      turnColor={turnColor}
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
    return <PlayerBanner key={Number(isOnTop)}
      name={isWhite ? game.white.name : game.black.name}
      rating={isWhite ? game.white.rating : game.black.rating}
      timeLeftMs={getTimeLeft()}
      isTicking={isTicking()}
      initDateTimeMs={game.timeLastTurnMs}
      color={isWhite ? PieceColor.White : PieceColor.Black}
      isOnTop={isOnTop}
      isWide={isWide}
      isUntimed={game.timeframe === "untimed"}
      layout={layout.value}
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

      const iMod = isWhiteTurn === isWhite ? -1 : 0;

      if (!isStatusOngoing && isWhiteTurn == isWhite) {
        return game.turns[game.turns.length - 1 + iMod].timeLeftMs
          -(new Date().getTime() - game.timeLastTurnMs);
      }

      const timeMod = !(postTurn.value && isWhiteTurn === isWhite) ? 0 :
        -(new Date().getTime() - game.timeLastTurnMs)
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
      isUntimed={game.timeframe === "untimed"}
      onBackClick={() => stepsBack.set(v => v + 1)}
      onForwardClick={() => stepsBack.set(v => v - 1)}
      onMenuClick={() => isMenuOpen.set(true)}
    />;
  }

  function getMenu() {
    return <MenuOnline
      isOpen={isMenuOpen}
      status={game.status}
      onTakebackClick={() => { }}
      onDrawClick={() => { }}
      onResignClick={() => { }}
      onRematchClick={() => { }}
      onNewOpponentClick={() => { }}
      onShareClick={() => { }}
    />
  }

  function handlePlayerMovedEvent() {
    SOCKET.off("playerMoved"); //change this 
    SOCKET.on("playerMoved", (gameId, newTurn, newStatus, timeCrntTurnMs) => {
      if (game.id.toString() !== gameId.toString()) return;

      const newTurns = game.turns.concat(newTurn);
      layout.set(startAndTurnsToBoardLayout(game.start, newTurns));
      setGame({
        ...game,
        turns: newTurns,
        status: newStatus,
        timeLastTurnMs: timeCrntTurnMs,
      });

      if (newStatus.catagory !== GameStatusCatagory.Ongoing) {
        isMenuOpen.set(true);
      }

      stepsBack.set(0);
      postTurn.set(false);

      promotionType.current = null;
    });
  }

  function handleTimeoutEvent() {
    useEffect(() => {
      SOCKET.on("timeout", (gameId, winColor) => {
        if (game.id.toString() !== gameId.toString()) return;

        setGame({
          ...game,
          status: {
            catagory: GameStatusCatagory.Win,
            winColor: winColor,
            reason: WinReason.Timeout,
          }
        });

        stepsBack.set(0);
        isMenuOpen.set(true);
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

