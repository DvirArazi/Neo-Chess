import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, OnGameUpdate } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { DrawReason, GameStatusCatagory } from "shared/types/game";

export default function handleDrawAccept(p: HandlerParams) {
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

    const game = (await p.gamesCollection.findOneAndUpdate(
      { _id: new ObjectId(gameId) },
      { $set: { status: { catagory: GameStatusCatagory.Draw, reason: DrawReason.Agreement } } }
    )).value;
    if (game === null) {
      Terminal.warning('Game ID provided by the user was not found in DB');
      return;
    }

    const isUserWhite = p.userId === game.white.id;

    const otherUser = await p.usersCollection.findOne(
      {_id: new ObjectId(isUserWhite ? game.black.id : game.white.id)}
    );
    if (otherUser === null) {
      Terminal.error('Could not find user with ID saved in game');
      return;
    }

    OnGameUpdate(p, user, otherUser, gameId, true);

    emitToUser(p, user, "drawAccepted", gameId);
    emitToUser(p, otherUser, "drawAccepted", gameId);
  });
}