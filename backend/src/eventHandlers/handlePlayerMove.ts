import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools";
import { getLegalMoves, isInCheckmate, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import Lodash from "lodash";
import { GameTurn, Point } from "shared/types/gameTypes";
import { BOARD_SIDE } from "shared/globals";

export default function handlePlayerMoved(p: HandlerParams) {
  p.socket.on("playerMove", async (gameId, from, to) => {
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

    const isWhite = (() => {
      if (game.white.id.toString() === user._id.toString()) return true;
      if (game.black.id.toString() === user._id.toString()) return false;
      return undefined;
    })();
    if (isWhite === undefined) {
      Terminal.warning('The user who tried to play a turn is not part of that game');
      return;
    }

    if (isWhite !== (game.turns.length % 2 == 0)) {
      Terminal.warning('The user who tried to play the current turn os of the opposite color')
    }

    const layout = startAndTurnsToBoardLayout(game.start, game.turns);
    const legalMovesResult = getLegalMoves(layout, isWhite, from);
    if (!legalMovesResult.ok) {
      Terminal.warning(legalMovesResult.error);
      return;
    }
    const legalMoves = legalMovesResult.value;

    if (!Lodash.some(legalMoves, to)) {
      Terminal.warning('The move sent by the user is illigal');
      return;
    }

    const turn: GameTurn = (() => {
      if (game.turns.length !== 0) {
        const lastTurn = game.turns[game.turns.length - 1];
        const delta = p.date.getTime() - game.timeLastTurn;
        return {
          action: pointsToAction(from, to),
          whiteTime: lastTurn.whiteTime - delta,
          blackTime: lastTurn.blackTime - delta,
        }
      } else {
        return {
          action: pointsToAction(from, to),
          whiteTime: game.timeframe.timeOverall,
          blackTime: game.timeframe.timeOverall,
        }
      }
    })();
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

    const otherUserId = isWhite ? game.white.id : game.black.id;
    const otherUser = await p.usersCollection.findOne({ _id: toValidId(otherUserId) });
    if (otherUser === null) {
      Terminal.error('Could not find other user saved on game');
      return;
    }

    isInCheckmate(startAndTurnsToBoardLayout(gameAfter.start, gameAfter.turns), !isWhite);

    emitToUser(p.webSocketServer, user, "playerMoved", turn);
    emitToUser(p.webSocketServer, otherUser, "playerMoved", turn);
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