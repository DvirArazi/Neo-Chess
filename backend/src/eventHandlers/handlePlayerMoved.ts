import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools";
import { getLegalMoves, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import Lodash from "lodash";
import { Point } from "shared/types/gameTypes";

export default function handlePlayerMoved(p: HandlerParams) {
  p.socket.on("playerMove", async (gameId, start, end) => {
    if (p.userId === undefined) {
      Terminal.warning('User attempted to play a turn without being registered');
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

    const layout = startAndTurnsToBoardLayout(game.start, game.turns);
    const legalMovesResult = getLegalMoves(layout, game.turns.length % 2 == 0, start);
    if (!legalMovesResult.ok) {
      Terminal.error(legalMovesResult.error);
      return;
    }
    const legalMoves = legalMovesResult.value;

    if (!Lodash.some(legalMoves, end)) {
      Terminal.warning('The move sent by the user is illigal');
      return;
    }

    const lastTurn = game.turns[game.turns.length - 1];
    const delta = p.date.getTime() - game.timeLastTurn;
    const gameUpdatedResult = await p.ongoingGamesCollection.findOneAndUpdate(
      { _id: game._id },/*This id has to be valid, right?*/
      {
        $push: {
          turns: {
            action: pointsToAction(start, end),
            whiteTime: lastTurn.whiteTime - delta,
            blackTime: lastTurn.blackTime - delta,
          }
        }
      },
      { returnDocument: "after" },
    );
    if (gameUpdatedResult.value === null) {
      Terminal.error('Could not find and update game');
      return;
    }
    const gameUpdated = gameUpdatedResult.value;

    const otherUserId = gameUpdated.white.id !== toValidId(user._id) ?
      game.white.id :
      game.black.id;
    const otherUser = await p.usersCollection.findOne({_id: toValidId(otherUserId)});
    if (otherUser === null) {
      Terminal.error('Could not find other user saved on game');
      return;
    }

    emitToUser(p.webSocketServer, user, "playerMoved", start, end);
  });
}

function pointsToAction(start: Point, end: Point) {
  return new Uint8Array([start.x * 10 + start.y, end.x * 10 + end.y]);
}