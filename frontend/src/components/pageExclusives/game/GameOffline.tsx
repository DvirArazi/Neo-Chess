import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import BottomBanner from "frontend/src/components/pageExclusives/game/BottomBanner";
import ModalFrame from "frontend/src/components/ModalFrame";
import PlayerBanner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import TopBanner from "frontend/src/components/pageExclusives/game/TopBanner";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef, useState } from "react";
import { pointsToAction, turnsToColor } from "shared/tools/board";
import { getGameStatus, generateStart, startAndTurnsToBoardLayout, step, pointToIndex, promote } from "shared/tools/boardLayout";
import { boardLayoutToRep } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { DrawReason, GameData, GameStatus, GameStatusCatagory, Point, Timeframe, WinReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import { MenuOffline } from "frontend/src/components/pageExclusives/game/GameOffline/MenuOffline";
import { getOppositeColor } from "shared/tools/piece";

export default function GameOffline(props: { timeframe: Timeframe }) {
  const { timeframe } = props;

  const [game, setGame] = useState<GameData>(getNewGame());
  const layout = new Stateful(startAndTurnsToBoardLayout(game.start, game.turns));
  const isMenuOpen = new Stateful<boolean>(false);
  const isFlipped = new Stateful(Math.random() < 0.5);
  const flipPieces = new Stateful(true);
  const stepsBack = new Stateful(0);
  const gameJustOver = new Stateful(false);

  const layoutRef = useRef<BoardLayout>(layout.value);
  const from = useRef<Point>({ x: 0, y: 0 });
  const to = useRef<Point>({ x: 0, y: 0 });
  const promotionType = useRef<PieceType | null>(null);
  const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined);

  const isWhiteTurn = game.turns.length % 2 === 0;

  useEffect(() => {
    if (game.status.catagory !== GameStatusCatagory.Ongoing) {
      isMenuOpen.set(true);
    }
    if (game.status.catagory !== GameStatusCatagory.Win ||
      game.status.reason !== WinReason.Timeout
    ) {
      gameJustOver.set(false);
    } 
  }, [game.status.catagory]);

  useEffect(() => {
    layout.set(startAndTurnsToBoardLayout(
      game.start,
      game.turns.slice(0, game.turns.length - stepsBack.value)
    ));
    gameJustOver.set(false);
  }, [stepsBack.value]);

  console.log(game.timeLastTurnMs);

  return (
    <Layout>
      {/* <TopBanner
        timeframe={{ overallSec: 10 * 60, incSec: 15 }}
        isRated={true}
      /> */}
      {getPlayerBanner(isFlipped.value)}
      <Board
        enabled={
          game.status.catagory === GameStatusCatagory.Ongoing &&
          stepsBack.value === 0
        }
        layout={layout.value}
        turnColor={turnsToColor(game.turns)}
        isFlipped={isFlipped.value}
        flipPieces={
          isWhiteTurn === isFlipped.value === (stepsBack.value % 2 === 0) &&
          flipPieces.value
        }
        onMove={onMove}
        onPromotion={onPromotion}
        onTurnEnd={onTurnEnd}
      />
      {getPlayerBanner(!isFlipped.value)}
      <BottomBanner
        canStepBack={stepsBack.value < game.turns.length}
        canStepForward={stepsBack.value > 0}
        onMenuClick={() => { isMenuOpen.set(true) }}
        onBackClick={() => stepsBack.set(stepsBack.value + 1)}
        onForwardClick={() => stepsBack.set(stepsBack.value - 1)}
      />
      <Box sx={{ padding: `10px` }} />
      <MenuOffline
        isOpen={isMenuOpen}
        status={game.status}
        isFlipped={flipPieces}
        onStartANewGame={handleStartANewGame}
      />
    </Layout>
  );

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
    const timeLeftMs = game.turns.length >= 2 ?
      (game.turns[game.turns.length - 2].timeLeftMs - (timeCrntTurnMs - game.timeLastTurnMs)) :
      game.timeframe.overallSec * 1000;

    const newTurns = game.turns.concat({
      action: pointsToAction(from.current, to.current),
      timeLeftMs: timeLeftMs,
      promotionType: promotionType.current,
      rep: boardLayoutToRep(layoutRef.current),
    });

    const newStatus = getGameStatus(
      layoutRef.current,
      turnsToColor(game.turns),
      newTurns,
      game.startRep
    );

    setGame({
      ...game,
      turns: newTurns,
      status: newStatus,
      timeLastTurnMs: timeCrntTurnMs
    });

    stepsBack.set(0);

    promotionType.current = null;

    if (timeoutId.current !== undefined) {
      clearTimeout(timeoutId.current);
    }
    if (game.turns.length >= 1) {
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
        gameJustOver.set(true);
      }, timeLeftMs);
    }
  }

  function handleStartANewGame() {
    const newGame = getNewGame();
    setGame(newGame);
    layout.set(startAndTurnsToBoardLayout(newGame.start, newGame.turns));
    isFlipped.set(Math.random() < 0.5);
    stepsBack.set(0);
  }

  function getPlayerBanner(isWhite: boolean) {
    return <PlayerBanner
      name={isWhite ? 'White' : 'Black'}
      rating={null}
      timeLeftMil={getTimeLeft()}
      isTicking={getIsTicking()}
      initDateTimeMil={game.timeLastTurnMs}
    />;

    function getTimeLeft() {
      if (
        isWhite && game.turns.length <= 1 ||
        !isWhite && game.turns.length <= 2
      ) {
        return game.timeframe.overallSec * 1000;
      }

      if (gameJustOver.value &&
        game.status.catagory === GameStatusCatagory.Win &&
        game.status.winColor === PieceColor.White !== isWhite
      ) {
        return 0;
      }

      const add = isWhiteTurn === isWhite ? -1 : 0;
      return game.turns[game.turns.length - 1 + add].timeLeftMs;
    }

    function getIsTicking() {
      return isWhite === isWhiteTurn &&
        game.turns.length > (isWhite ? 1 : 2) &&
        game.status.catagory === GameStatusCatagory.Ongoing
    }
  }
}