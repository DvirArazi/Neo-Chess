import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { PieceColor } from "shared/types/piece";

export default function handleTakebackRequest(p: HandlerParams) {
  p.socket.on("takebackRequest", async (gameId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to request a takeback but was not signed in');
      return;
    }

    const game = await p.gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (game === null) {
      Terminal.warning('Game ID provided by the user was not found in DB');
      return;
    }

    const isUserWhite = p.userId === game.white.id;
    const crnt = game.turns.length;
    const toTurn = crnt + (isUserWhite ? -2 + (crnt % 2) : -1 - (crnt % 2));

    p.gamesCollection.updateOne(
      { _id: game._id },
      {
        $set: {
          takeback: {
            color: isUserWhite ? PieceColor.White : PieceColor.Black,
            toTurn: toTurn
          }
        }
      }
    );

    const otherUser = await p.usersCollection.findOne(
      { _id: new ObjectId(isUserWhite ? game.black.id : game.white.id) }
    );
    if (otherUser === null) {
      Terminal.error('User with the ID saved in game was not found in DB');
      return;
    }


    emitToUser(p, otherUser, "takebackRequested", gameId);
  });
}