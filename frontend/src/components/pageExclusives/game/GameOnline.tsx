import { Box, Modal } from "@mui/material";
import Layout from "frontend/src/components/Layout";
import Board from "frontend/src/components/pageExclusives/game/Board";
import FormatBanner from "frontend/src/components/pageExclusives/game/FormatBanner";
import ButtonsBannerOnline from "frontend/src/components/pageExclusives/game/GameOnline/ButtonsBannerOnline";
import PlayerBanner from "frontend/src/components/pageExclusives/game/PlayerBanner";
import { SOCKET, WINDOW_WIDTH } from "frontend/src/pages/_app";
import Stateful from "frontend/src/utils/tools/stateful";
import { useEffect, useRef } from "react";
import { turnsToColor } from "shared/tools/board";
import { pointToIndex, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { getOppositeColor } from "shared/tools/piece";
import { BoardLayout } from "shared/types/boardLayout";
import { GameStatusCatagory, GameStatus, GameTurn, GameViewData } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function GameOnline(props: { data: GameViewData }) {
  const {
    id,
    role,
    white,
    black,
    isRated,
    start,
    timeframe,
    turns,
  } = props.data;

  console.log(role)

  const isWide = WINDOW_WIDTH > 600;

  const gameTurns = new Stateful<GameTurn[]>(turns);
  const layout = new Stateful<BoardLayout>(startAndTurnsToBoardLayout(start, gameTurns.value));
  const turnColor = new Stateful<PieceColor>(turnsToColor(gameTurns.value));
  const gameStatus = new Stateful<GameStatus>({ catagory: GameStatusCatagory.Ongoing });
  const openModal = new Stateful<boolean>(false);

  SOCKET.off("playerMoved");
  SOCKET.on("playerMoved", (gameId, turn, status) => {
    if (id.toString() !== gameId.toString()) return;

    const newTurns = gameTurns.value.concat(turn);
    gameTurns.set(newTurns);
    layout.set(startAndTurnsToBoardLayout(start, newTurns))
    turnColor.set(turnsToColor(newTurns))
    gameStatus.set(status);

    if (status.catagory !== GameStatusCatagory.Ongoing) {
      openModal.set(true);
    }
  });

  return <Layout>
    {getNarrowLayout()}
  </Layout>;

  function getWideLayout() {
  }

  function getNarrowLayout() {
    return <>
      {getTopBanner()}
      {getPlayerBanner(role !== PieceColor.White, true)}
      {getBoard()}
      {getPlayerBanner(role !== PieceColor.Black, false)}
      {getButtonsBanner()}
    </>
  }

  function getBoard() {
    return <Board
      enabled={role === turnColor.value &&
        gameStatus.value.catagory === GameStatusCatagory.Ongoing}
      layout={layout.value}
      turnColor={turnColor.value}
      onMove={() => { }}
      onPromotion={() => { }}
      onTurnEnd={() => {
        // turnColor.set(getOppositeColor(turnColor.value));
        // SOCKET.emit("playerMove", id, from, to, promotionType);
      }}
      isFlipped={role === PieceColor.Black}
      flipPieces={false}
    />;
  }

  function getTopBanner() {
    return <FormatBanner
      isRated={isRated}
      isWide={isWide}
      timeframe={timeframe}
    />
  }

  function getPlayerBanner(isWhite: boolean, isOnTop: boolean) {
    return <PlayerBanner key={Number(isOnTop)}
      name={isWhite ? 'White' : 'Black'}
      rating={null}
      timeLeftMil={0}
      isTicking={true}
      initDateTimeMil={0}
      color={isWhite ? PieceColor.White : PieceColor.Black}
      isOnTop={isOnTop}
      isWide={isWide}
      isUntimed={timeframe === "untimed"}
      layout={layout.value}
    />;
  }

  function getButtonsBanner() {
    return <ButtonsBannerOnline
      canStepBack={true}
      canStepForward={true}
      isUntimed={timeframe === "untimed"}
      onBackClick={() => { }}
      onForwardClick={() => { }}
      onMenuClick={() => { }}
    />;
  }
}

