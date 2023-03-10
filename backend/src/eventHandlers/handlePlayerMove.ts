import { BackendParams, HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { BOARD_SIDE, getGameStatus, getLegalMoves, isInCheckmate, isKingCaptured, startAndTurnsToBoardLayout, step } from "shared/tools/boardLayout";
import Lodash from "lodash";
import { DrawReason, GameStatusCatagory, GameStatus, Point, WinReason, GameTurn } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep, hasCausedRepetition } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { pointsToAction, turnsToColor } from "shared/tools/board";
import { emitToUser, handleGameUpdate } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";

export default function handlePlayerMoved(p: HandlerParams) {
  p.socket.on("playerMove", async (gameId, from, to, promotionType) => {
    const timeCrntTurnMs = new Date().getTime();

    if (p.userId === undefined) {
      Terminal.warning('User attempted to play a turn in an online game without being registered');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });
    if (user === null) {
      Terminal.error('Couldn\'nt find user with the saved user ID');
      return;
    }

    const game = await p.gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (game === null) {
      Terminal.warning('Couldn\'nt find game using the id provided by the user');
      return;
    }

    const turnColor = (() => {
      if (game.white.id.toString() === user._id.toString()) return PieceColor.White;
      if (game.black.id.toString() === user._id.toString()) return PieceColor.Black;
      return undefined;
    })();
    if (turnColor === undefined) {
      Terminal.warning('The user who tried to play a turn is not a player in this game');
      return;
    }

    if (turnColor !== (game.turns.length % 2 == 0 ? PieceColor.White : PieceColor.Black)) {
      Terminal.warning('The user who tried to play the current turn is of the opposite color');
      return;
    }

    const layout = startAndTurnsToBoardLayout(game.start, game.turns);

    if (promotionType !== null && !isPromotionValid(layout, turnColor, promotionType)) {
      Terminal.warning('The user tried to promote to an invalid piece');
      return;
    }

    const legalMovesResult = getLegalMoves(layout, turnColor, from);
    if (!legalMovesResult.ok) {
      Terminal.warning(legalMovesResult.error);
      return;
    }
    const legalMoves = legalMovesResult.value;

    if (!Lodash.some(legalMoves, to)) {
      Terminal.warning('The move sent by the user is illigal');
      return;
    }

    const newTimeLeftMs = game.timeframe === "untimed" ? 0 :
      game.turns.length < 2 ? game.timeframe.overallSec * 1000 :
        (
          game.turns[game.turns.length - 2].timeLeftMs
          - (timeCrntTurnMs - game.timeLastTurnMs)
          + game.timeframe.incSec * 1000
        );

    const newTurns: GameTurn[] = [
      ...game.turns,
      {
        action: pointsToAction(from, to),
        timeLeftMs: newTimeLeftMs,
        promotionType: promotionType,
        rep: boardLayoutToRep(step(layout, from, to, promotionType)),
      }
    ];

    const newLayout = startAndTurnsToBoardLayout(game.start, newTurns);

    const newStatus: GameStatus = getGameStatus(
      newLayout, getOppositeColor(turnsToColor(newTurns)), newTurns, game.startRep
    );

    const otherUserId = turnColor ? game.white.id : game.black.id;
    const otherUser = await p.usersCollection.findOne({ _id: new ObjectId(otherUserId) });
    if (otherUser === null) {
      Terminal.error('Could not find other user saved on game');
      return;
    }

    if (game.timeoutId !== null) { clearTimeout(game.timeoutId); }
    const newTimeoutId =
      game.turns.length < 1 || newStatus.catagory !== GameStatusCatagory.Ongoing ? null :
        Number(setTimeout(async () => {
          const winColor = turnsToColor(game.turns);

          await p.gamesCollection.updateOne(
            { _id: game._id },
            {
              $set: {
                status: {
                  catagory: GameStatusCatagory.Win,
                  winColor: winColor,
                  reason: WinReason.Timeout,
                },
              }
            }
          );

          await handleGameUpdate(p, gameId);

          emitToUser(p, user, "timeout", game._id.toString(), winColor);
          emitToUser(p, otherUser, "timeout", game._id.toString(), winColor);
        }, newTimeLeftMs));

    await p.gamesCollection.updateOne(
      { _id: game._id },
      {
        $set: {
          turns: newTurns,
          timeLastTurnMs: timeCrntTurnMs,
          timeoutId: newTimeoutId,
          status: newStatus,
        }
      }
    );

    await handleGameUpdate(p, gameId);

    const lastTurn = newTurns[newTurns.length - 1];

    emitToUser(p, user, "playerMoved", gameId, lastTurn, newStatus, timeCrntTurnMs);
    emitToUser(p, otherUser, "playerMoved", gameId, lastTurn, newStatus, timeCrntTurnMs);

    if (game.viewerSocketIds.length !== 0) {
      p.webSocketServer.to(game.viewerSocketIds).emit("playerMoved",
        gameId, lastTurn, newStatus, timeCrntTurnMs
      );
    }
  });
}

function isPromotionValid(layout: BoardLayout, turnColor: PieceColor, promotion: PieceType) {
  const pieceLimits: { type: PieceType, limit: number }[] = [
    { type: PieceType.Queen, limit: 1 },
    { type: PieceType.Rook, limit: 2 },
    { type: PieceType.Knight, limit: 2 },
    { type: PieceType.Bishop, limit: 2 },
  ];

  for (let i = 0; i < pieceLimits.length; i++) {
    if (promotion === pieceLimits[i].type) {
      let count = 0;
      for (const square of layout) {
        if (square?.type === promotion && square.color === turnColor) {
          count += 1;
          if (count >= pieceLimits[i].limit) {
            return false;
          }
        }
      }
    }
  }

  return true;
}