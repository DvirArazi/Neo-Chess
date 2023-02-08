import { BackendParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { GameInvitation } from "shared/types/general";

export default async function usersSetOutInvitation(
  p: BackendParams,
  userId: string,
  value: GameInvitation
): Promise<boolean> {
  const user = (await p.usersCollection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: { outInvitation: value, gameRequestId: null} },
    { returnDocument: "after" }
  )).value;
  if (user === null) {
    Terminal.warning('User ID was not found in DB');
    return false;
  }

  emitToUser(p, user, "gameRequestUpdated", {
    timeframe: value.timeframe,
    isRated: value.isRated,
    isByRating: false,
    opponentName: value.friendName,
  })

  return true;
}