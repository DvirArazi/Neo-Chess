import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import ButtonsBanner from "frontend/src/components/pageExclusives/game/BottomBanner";
import ModalFrame from "frontend/src/components/ModalFrame";
import PlayerBanner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import FormatBanner from "frontend/src/components/pageExclusives/game/TopBanner";
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
import { THEME, WINDOW_WIDTH } from "frontend/src/pages/_app";

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

  const turnsLength = game.turns.length - stepsBack.value;
  const isWhiteTurn = turnsLength % 2 === 0;

  handleGameStatusChange();
  handleStepsBackChange();
  handleGameTurnsChange();

  return (<>
    {WINDOW_WIDTH > 600 ? getWideLayout() : getNarrowLayout()}
    {getMenuOffline()}
  </>);

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

    const newTimeLeftMs = turnsLength >= 2 ?
      (game.turns[turnsLength - 2].timeLeftMs - (timeCrntTurnMs - game.timeLastTurnMs)) :
      game.timeframe.overallSec * 1000;

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
      if (gameJustOver.value &&
        game.status.catagory === GameStatusCatagory.Win &&
        game.status.winColor === PieceColor.White !== isWhite
      ) {
        return 0;
      }
      if (turnsLength <= 1) {
        return game.timeframe.overallSec * 1000;
      }



      const add = isWhiteTurn === isWhite ? -1 : 0;
      return game.turns[turnsLength - 1 + add].timeLeftMs;
    }

    function getIsTicking() {
      return isWhite === isWhiteTurn &&
        turnsLength > (isWhite ? 1 : 2) &&
        game.status.catagory === GameStatusCatagory.Ongoing
    }
  }

  function handleGameStatusChange() {
    useEffect(() => {
      if (game.status.catagory !== GameStatusCatagory.Ongoing) {
        isMenuOpen.set(true);
      }
      if (game.status.catagory !== GameStatusCatagory.Win ||
        game.status.reason !== WinReason.Timeout
      ) {
        gameJustOver.set(false);
      }
    }, [game.status]);
  }

  function handleStepsBackChange() {
    useEffect(() => {
      layout.set(startAndTurnsToBoardLayout(
        game.start,
        game.turns.slice(0, turnsLength)
      ));
      gameJustOver.set(false);
    }, [stepsBack.value]);
  }

  function handleGameTurnsChange() {
    useEffect(() => {
      if (timeoutId.current !== undefined) {
        clearTimeout(timeoutId.current);
      }

      if (turnsLength >= 2) {
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
        }, game.turns[turnsLength - 1].timeLeftMs);
      }
    }, [game.turns]);
  }

  function getFormatBanner() {
    return <FormatBanner
      timeframe={timeframe}
      isRated={true}
    />
  }

  function getBoard() {
    return <Board
      enabled={
        game.status.catagory === GameStatusCatagory.Ongoing// &&
        // stepsBack.value === 0
      }
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
    return <ButtonsBanner
      canStepBack={stepsBack.value < game.turns.length}
      canStepForward={stepsBack.value > 0}
      onMenuClick={() => { isMenuOpen.set(true) }}
      onBackClick={() => stepsBack.set(v => v + 1)}
      onForwardClick={() => stepsBack.set(v => v - 1)}
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
    return <Layout>
      <Box sx={{margin: `auto`}}>
        {getFormatBanner()}
        {getPlayerBanner(isFlipped.value)}
        {getBoard()}
        {getPlayerBanner(!isFlipped.value)}
        {getButtonsBanner()}
        <Box sx={{ padding: `5px` }} />
      </Box>
    </Layout>
  }

  function getWideLayout() {
    return <Layout>
      <Box sx={{ padding: `10px` }}></Box>
      <Box sx={{
        display: `flex`,
        flexDirection: `row`,
        justifyContent: `center`,
        maxWidth: `1000px`,
        margin: `auto`,
      }}>
        <Box sx={{
          flex: `1`,
          margin: `10px`,
          background: THEME.boxBackground
        }}>
          {getFormatBanner()}
          {getButtonsBanner()}
        </Box>
        <Box sx={{ flexBasis: `500px` }}>
          {getBoard()}
        </Box>
        <Box sx={{
          flex: `1`,
          margin: `10px`,
          background: THEME.boxBackground,
        }}>
          {getPlayerBanner(isFlipped.value)}
          {getPlayerBanner(!isFlipped.value)}
        </Box>
      </Box>
    </Layout>
  }
}