import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { PieceColor } from "shared/types/piece";

export default function handleDrawOffer(p: HandlerParams) {
  p.socket.on("drawOffer", async (gameId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to offer a draw but was not signed in');
      return;
    }

    const game = await p.gamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (game === null) {
      Terminal.warning('Game ID provided by the user was not found in DB');
      return;
    }

    const isUserWhite = p.userId === game.white.id;

    p.gamesCollection.updateOne(
      { _id: game._id },
      { $set: { drawOffer: isUserWhite ? PieceColor.White : PieceColor.Black } }
    );

    const otherUser = await p.usersCollection.findOne(
      { _id: new ObjectId(isUserWhite ? game.black.id : game.white.id) }
    );
    if (otherUser === null) {
      Terminal.error('User ID saved on Game was not found in DB');
      return;
    }

    emitToUser(p, otherUser, "drawOffered", gameId);
  });
}