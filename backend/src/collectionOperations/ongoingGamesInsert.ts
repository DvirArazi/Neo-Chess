import { BackendParams } from "backend/src/handleSocket";
import { emitToUser, getOngoingGamesTd } from "backend/src/utils/tools/general";
import { Game } from "backend/src/utils/types";
import { ObjectId } from "mongodb";

export default async function ongoingGamesInsert(p: BackendParams, game: Game) {
  const gameId = (await p.ongoingGamesCollection.insertOne(game)).insertedId.toString();

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