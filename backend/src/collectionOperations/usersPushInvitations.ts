import { BackendParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { GameInvitation } from "shared/types/general";

export default async function usersPushInvitations(
  p: BackendParams,
  userId: string,
  value: GameInvitation,
): Promise<boolean> {

  await p.usersCollection.updateOne(
    {_id: new ObjectId(userId)},
    {$pull: {invitations: {friendId: value.friendId}}}
  );

  const user = (await p.usersCollection.findOneAndUpdate(
    {_id: new ObjectId(userId)},
    {$push: {invitations: value}},
    {returnDocument: "after"}
  )).value;
  if (user === null) {
    Terminal.warning('User ID was not found in DB');
    return false
  };

  emitToUser(p, user, "gameInvitationsUpdated", user.invitations);

  return true;
}