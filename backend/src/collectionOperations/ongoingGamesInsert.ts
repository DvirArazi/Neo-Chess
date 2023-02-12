import { BackendParams } from "backend/src/handleSocket";
import { emitToUser, getOngoingGamesTd } from "backend/src/utils/tools/general";
import { Game } from "backend/src/utils/types";
import { ObjectId } from "mongodb";

export default async function ongoingGamesInsert(p: BackendParams, game: Game) {
  const gameId = (await p.gamesCollection.insertOne(game)).insertedId.toString();

  updateUser(game.white.id);
  updateUser(game.black.id);

  async function updateUser(id: string) {  
    const user = (await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $push: { ongoingGamesIds: gameId },
        $set: {gameRequestId: null, outInvitation: null},
      },
      { returnDocument: "after" },
    )).value;
    if (user === null) return;
  
    emitToUser(p, user, "createdGame", game.path);
    emitToUser(p, user, "ongoingGamesUpdated", await getOngoingGamesTd(p, user));
    emitToUser(p, user, "gameRequestUpdated", null);
  }
}