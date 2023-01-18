import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { getLegalMoves, isInCheckmate, isKingCaptured, startAndTurnsToBoardLayout, step } from "shared/tools/boardLayout";
import Lodash from "lodash";
import { DrawReason, GameStatusCatagory, GameStatus, Point, WinReason } from "shared/types/game";
import { BOARD_SIDE } from "shared/globals";
import { PieceColor, PieceType } from "shared/types/piece";
import { getOppositeColor } from "shared/tools/piece";
import { GameTurnWithRep } from "backend/src/utils/types";
import { boardLayoutToRep, hasCausedRepetition } from "backend/src/utils/tools/rep";
import { BoardLayout } from "shared/types/boardLayout";

export default function handlePlayerMoved(p: HandlerParams) {
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

    const [whiteTime, blackTime] = (() => {
      if (game.turns.length !== 0) {
        const lastTurn = game.turns[game.turns.length - 1];
        const delta = p.date.getTime() - game.timeLastTurn;
        return [
          lastTurn.whiteTime - delta,
          lastTurn.blackTime - delta,
        ]
      } else {
        return [
          game.timeframe.timeOverall,
          game.timeframe.timeOverall,
        ];
      }
    })();

    const turn: GameTurnWithRep = {
      action: pointsToAction(from, to),
      whiteTime: whiteTime,
      blackTime: blackTime,
      promotion: promotion,
      rep: boardLayoutToRep(step(layout, from, to)),
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
          winSide: turnColor,
          reason: WinReason.KingCaptured,
        }
      }
      if (isInCheckmate(layoutAfter, getOppositeColor(turnColor))) {
        return {
          catagory: GameStatusCatagory.Win,
          winSide: turnColor,
          reason: WinReason.Checkmate,
        }
      }
      if (hasCausedRepetition(gameAfter)) {
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

function pointsToAction(from: Point, to: Point) {
  return (
    from.x +
    from.y * BOARD_SIDE +
    to.x * BOARD_SIDE ** 2 +
    to.y * BOARD_SIDE ** 3
  );
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