import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { BOARD_SIDE, getLegalMoves, isInCheckmate, isKingCaptured, startAndTurnsToBoardLayout, step } from "shared/tools/boardLayout";
import Lodash from "lodash";
import { DrawReason, GameStatusCatagory, GameStatus, Point, WinReason, GameTurn } from "shared/types/game";
import { PieceColor, PieceType } from "shared/types/piece";
import { getOppositeColor } from "shared/tools/piece";
import { boardLayoutToRep, hasCausedRepetition } from "shared/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";
import { pointsToAction } from "shared/tools/board";

export default function handlePlayerMoved(p: HandlerParams) {
  Terminal.warning('delete 0');

  p.socket.on("playerMove", async (gameId, from, to, promotion) => {
    if (p.userId === undefined) {
      Terminal.warning('User attempted to play a turn in an online game without being registered');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user === null) {
      Terminal.error('Couldn\'nt find user with saved user ID');
      return;
    }

    const game = await p.ongoingGamesCollection.findOne({ _id: toValidId(gameId) });
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
      Terminal.warning('The user who tried to play a turn is not part of that game');
      return;
    }

    if (turnColor !== (game.turns.length % 2 == 0 ? PieceColor.White : PieceColor.Black)) {
      Terminal.warning('The user who tried to play the current turn is of the opposite color');
      return;
    }

    const layout = startAndTurnsToBoardLayout(game.start, game.turns);

    if (promotion !== null && !isPromotionValid(layout, turnColor, promotion)) {
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

    const whiteTime = (() => {
      if (game.turns.length !== 0) {
        const lastTurn = game.turns[game.turns.length - 1];
        const delta = p.date.getTime() - game.timeLastTurnMs;

        return lastTurn.timeLeftMs - delta;
      } else {
        return game.timeframe.overallSec;
      }
    })();

    const turn: GameTurn = {
      action: pointsToAction(from, to),
      timeLeftMs: whiteTime,
      promotionType: promotion,
      rep: boardLayoutToRep(step(layout, from, to, promotion)),
    };

    const gameAfterResult = await p.ongoingGamesCollection.findOneAndUpdate(
      { _id: game._id },/*This id has to be valid, right?*/
      {
        $push: {
          turns: turn
        }
      },
      { returnDocument: "after" },
    );
    if (gameAfterResult.value === null) {
      Terminal.error('Could not find and update game');
      return;
    }
    const gameAfter = gameAfterResult.value;

    const otherUserId = turnColor ? game.white.id : game.black.id;
    const otherUser = await p.usersCollection.findOne({ _id: toValidId(otherUserId) });
    if (otherUser === null) {
      Terminal.error('Could not find other user saved on game');
      return;
    }

    const layoutAfter = startAndTurnsToBoardLayout(gameAfter.start, gameAfter.turns);

    const status: GameStatus = (() => {
      if (isKingCaptured(layoutAfter, getOppositeColor(turnColor))) {
        return {
          catagory: GameStatusCatagory.Win,
          winColor: turnColor,
          reason: WinReason.KingCaptured,
        }
      }
      if (isInCheckmate(layoutAfter, getOppositeColor(turnColor))) {
        return {
          catagory: GameStatusCatagory.Win,
          winColor: turnColor,
          reason: WinReason.Checkmate,
        }
      }
      if (hasCausedRepetition(gameAfter.turns, gameAfter.startRep)) {
        return {
          catagory: GameStatusCatagory.Draw,
          reason: DrawReason.Repetition,
        }
      }

      return { catagory: GameStatusCatagory.Ongoing };
    })();

    emitToUser(p.webSocketServer, user, "playerMoved", gameId, turn, status);
    emitToUser(p.webSocketServer, otherUser, "playerMoved", gameId, turn, status);
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