import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, handleGameUpdate } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { DrawReason, GameStatusCatagory } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function handleDrawResponse(p: HandlerParams) {
  p.socket.on("drawAccept", async (gameId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to accpet a draw but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });
    if (user === null) {
      Terminal.error('User with saved ID could not be found in DB');
      return;
    }

    const game = await p.gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (game === null) {
      Terminal.warning('Game ID provided by the user was not found in DB');
      return;
    }

    const isUserWhite = p.userId === game.white.id;

    if (game.drawOffer !== (isUserWhite ? PieceColor.Black : PieceColor.White)) {
      Terminal.warning('User tried to accept a draw offer, but no offer from the opponent was made');
      return;
    }

    await p.gamesCollection.updateOne(
      { _id: game._id },
      {
        $set: {
          status: { catagory: GameStatusCatagory.Draw, reason: DrawReason.Agreement }
        }
      }
    );

    const otherUser = await p.usersCollection.findOne(
      { _id: new ObjectId(isUserWhite ? game.black.id : game.white.id) }
    );
    if (otherUser === null) {
      Terminal.error('Could not find user with ID saved in game');
      return;
    }

    await handleGameUpdate(p, gameId);

    emitToUser(p, user, "drawAccepted", gameId);
    emitToUser(p, otherUser, "drawAccepted", gameId);
  });
}