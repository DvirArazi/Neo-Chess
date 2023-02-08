import { emitToUser, getOngoingGamesTd } from "backend/src/utils/tools/general";
import { BackendParams } from "backend/src/handleSocket";
import { ObjectId } from "mongodb";

export default function watchGames(p: BackendParams) {
  p.ongoingGamesCollection.watch().on("change", async (e) => {
    if (e.operationType === "insert") {
      const game = e.fullDocument;
      const gameId = e.documentKey._id.toString();

      const userWhite = (await p.usersCollection.findOneAndUpdate(
        { _id: new ObjectId(game.white.id) },
        { $push: { ongoingGamesIds: gameId } },
        { returnDocument: "after" },
      )).value;
      if (userWhite === null) return;
      const userBlack = (await p.usersCollection.findOneAndUpdate(
        { _id: new ObjectId(game.black.id) },
        { $push: { ongoingGamesIds: gameId } },
        { returnDocument: "after" },
      )).value;
      if (userBlack === null) return;

      emitToUser(p, userWhite, "createdGame", game.path);
      emitToUser(p, userBlack, "createdGame", game.path);

      emitToUser(p, userWhite, "ongoingGamesUpdated", await getOngoingGamesTd(p, userWhite));
      emitToUser(p, userBlack, "ongoingGamesUpdated", await getOngoingGamesTd(p, userBlack));
    }
  });
}