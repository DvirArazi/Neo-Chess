import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";

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