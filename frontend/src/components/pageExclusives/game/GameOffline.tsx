import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import BottomBanner from "frontend/src/components/pageExclusives/game/BottomBanner";
import MenuModal from "frontend/src/components/MenuModal";
import PlayerBunner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import TopBanner from "frontend/src/components/pageExclusives/game/TopBanner";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef, useState } from "react";
import { pointsToAction, turnsToColor } from "shared/tools/board";
import { getGameStatus, generateStart, startAndTurnsToBoardLayout, step, pointToIndex, promote } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { GameData, GameStatus, GameStatusCatagory, Point, Timeframe } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";

export default function GameOffline(props: { timeframe: Timeframe }) {
  const { timeframe } = props;

  const [game, setGame] = (() => {
    const start = generateStart();
    return useState<GameData>({
      timeframe: timeframe,
      isRated: false,
      start: start,
      timeLastTurn: new Date().getTime(),
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
      turns: [],
      status: { catagory: GameStatusCatagory.Ongoing }
    })
  })();
  const isModalOpen = new Stateful<boolean>(true);
  const layout = new Stateful(startAndTurnsToBoardLayout(game.start, game.turns));
  const layoutRef = useRef<BoardLayout>(layout.value);
  const from = useRef<Point>({ x: 0, y: 0 });
  const to = useRef<Point>({ x: 0, y: 0 });
  const promotionType = useRef<PieceType | null>(null);

  return (
    <Layout>
      <TopBanner
        timeframe={{
          timeOverall: 10*60,
          increment: 15
        }}
        isRated={true}
      />
      <PlayerBunner name={'White'} rating={1234} />
      <Board
        enabled={game.status.catagory === GameStatusCatagory.Ongoing}
        layout={layout.value}
        turnColor={turnsToColor(game.turns)}
        onMove={onMove}
        onPromotion={onPromotion}
        onTurnEnd={onTurnEnd}
      />
      <PlayerBunner name={'Black'} rating={null} />
      <BottomBanner onMenuClick={() => { isModalOpen.set(true) }} />
      <Box sx={{ padding: `10px` }} />
      <MenuModal
        isOpen={isModalOpen}
        status={game.status}
      />
    </Layout>
  );

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
    const newTurns = game.turns.concat({
      action: pointsToAction(from.current, to.current),
      whiteTime: 0, //change later
      blackTime: 0, //change later
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
      isModalOpen.set(true);
    }
  }
}