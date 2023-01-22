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
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { DrawReason, GameData, GameStatus, GameStatusCatagory, Point, Timeframe, WinReason } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import MenuOnline from "frontend/src/components/pageExclusives/game/GameOnline/MenuOnline";
import { MenuOffline } from "frontend/src/components/pageExclusives/game/GameOffline/MenuOffline";

export default function GameOffline(props: { timeframe: Timeframe }) {
  const { timeframe } = props;

  const [game, setGame] = useState<GameData>(getNewGame());
  const layout = new Stateful(startAndTurnsToBoardLayout(game.start, game.turns));
  const isMenuOpen = new Stateful<boolean>(true);
  const isFlipped = new Stateful(Math.random() < 0.5); //switch with 
  const flipPieces = new Stateful(true);
  const layoutRef = useRef<BoardLayout>(layout.value);
  const from = useRef<Point>({ x: 0, y: 0 });
  const to = useRef<Point>({ x: 0, y: 0 });
  const promotionType = useRef<PieceType | null>(null);

  return (
    <Layout>
      <TopBanner
        timeframe={{
          overallSec: 10 * 60,
          incSec: 15
        }}
        isRated={true}
      />
      <PlayerBanner
        name={'White'}
        rating={1234}
        timeLeftMil={(game.turns.length === 0 ?
          game.timeframe.overallSec * 1000 :
          game.turns[game.turns.length - 1].timeLeftMil
        )}
        tick={game.turns.length % 2 === 0}
      />
      <Board
        enabled={game.status.catagory === GameStatusCatagory.Ongoing}
        layout={layout.value}
        turnColor={turnsToColor(game.turns)}
        isFlipped={isFlipped.value}
        flipPieces={game.turns.length % 2 === 0 === isFlipped.value && flipPieces.value}
        onMove={onMove}
        onPromotion={onPromotion}
        onTurnEnd={onTurnEnd} />
      {/* <PlayerBunner name={'Black'} rating={null} /> */}
      <BottomBanner onMenuClick={() => { isMenuOpen.set(true) }} />
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
      timeLastTurn: new Date().getTime(),
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
    const timeCrntTurn = new Date().getTime();
    const newTurns = game.turns.concat({
      action: pointsToAction(from.current, to.current),
      timeLeftMil: game.turns.length > 2 ?
        (game.turns[game.turns.length - 2].timeLeftMil - (game.timeLastTurn - timeCrntTurn)) :
        game.timeframe.overallSec * 1000,
      promotionType: promotionType.current,
      rep: boardLayoutToRep(layoutRef.current),
    });
    const newStatus = getGameStatus(layoutRef.current, turnsToColor(game.turns), newTurns, game.startRep);

    setGame({
      ...game,
      turns: newTurns,
      status: newStatus,
    });

    promotionType.current = null;

    if (newStatus.catagory !== GameStatusCatagory.Ongoing) {
      isMenuOpen.set(true);
    }
  }

  function handleStartANewGame() {
    const newGame = getNewGame();
    setGame(newGame);
    layout.set(startAndTurnsToBoardLayout(newGame.start, newGame.turns));
    isFlipped.set(Math.random() < 0.5);
  }
}