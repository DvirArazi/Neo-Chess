import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, handleGameUpdate } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { PieceColor } from "shared/types/piece";

export default function handleTakebackAccept(p: HandlerParams) {
  p.socket.on("takebackAccept", async (gameId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to accept a takeback but was not signed in');
      return;
    }

    const game = await p.gamesCollection.findOne(
      { _id: new ObjectId(gameId) }
    );
    if (game === null) {
      Terminal.warning('Game ID provided by the user was not found in DB');
      return;
    }

    const isUserWhite = p.userId === game.white.id;

    if (
      game.takeback === null ||
      game.takeback.color !== (isUserWhite ? PieceColor.Black : PieceColor.White)
    ) {
      Terminal.warning('User tried to accept a takeback, but no takeback was requested');
      return;
    }

    p.gamesCollection.findOneAndUpdate(
      { _id: game._id },
      {
        $set: {
          takeback: null,
          turns: game.turns.slice(0, game.takeback?.toTurn)
        }
      }
    );

    const user = await p.usersCollection.findOne({_id: new ObjectId(p.userId)});
    if (user === null) {
      Terminal.error('Saved user ID could not be found in DB');
      return;
    }

    const otherUser = await p.usersCollection.findOne(
      {_id: new ObjectId(isUserWhite ? game.black.id : game.white.id)}
    );
    if (otherUser === null) {
      Terminal.error('Could not find user with ID saved in game');
      return;
    }

    handleGameUpdate(p, user, otherUser, gameId, false);

    const crntTimeMs = new Date().getTime();

    emitToUser(p, user, "takebackAccepted", gameId, game.takeback.toTurn, crntTimeMs);
    emitToUser(p, otherUser, "takebackAccepted", gameId, game.takeback.toTurn, crntTimeMs);
  });
}