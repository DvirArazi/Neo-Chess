import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, handleGameUpdate } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { GameStatusCatagory, WinReason } from "shared/types/game";
import { PieceColor } from "shared/types/piece";

export default function handleResign(p: HandlerParams) {
  p.socket.on("resign", async (gameId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to resign but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });
    if (user === null) {
      Terminal.error('User with saved ID was not found in DB');
      return;
    }

    const game = await p.gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (game === null) {
      Terminal.warning('Game ID provided by the user was not found in DB');
      return;
    }

    const isUserWhite = p.userId === game.white.id;
    const winColor = isUserWhite ? PieceColor.Black : PieceColor.White;

    await p.gamesCollection.updateOne(
      { _id: game._id },
      {
        $set: {
          status: {
            catagory: GameStatusCatagory.Win,
            winColor: winColor,
            reason: WinReason.Resignation
          }
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

    emitToUser(p, user, "resigned", gameId, winColor);
    emitToUser(p, otherUser, "resigned", gameId, winColor);
  });
}