import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { User, WebSocketServer } from "backend/src/utils/types";
import { WithId } from "mongodb";
import { remove } from "shared/tools/general";

export async function leave(p: HandlerParams, isSigningOut: boolean): Promise<User | undefined> {
  Terminal.log('----leaving----');

  if (p.userId === undefined) {
    return undefined;
  }

  //removes the socket.id entry with the matching key
  //replaces it with a new entry with the same key but without the current socket ID
  //===================================================*****************************
  const userResult = await p.usersCollection.findOneAndUpdate(
    {
      _id: toValidId(p.userId),
    },
    { $pull: { socketsIds: { values: [p.socket.id] } } },
    { returnDocument: "before" },
  );
  if (userResult.value === null) {
    Terminal.warning('User signed out with an invalid ID');
    p.socket.emit("signedOut");
    return undefined;
  }
  const userBefore = userResult.value;

  const entry = userBefore.socketsIds.find(entry => entry.values.includes(p.socket.id));
  if (entry === undefined) {
    Terminal.warning('Couldn\'t find an entry matching the key sent by the user');
    return undefined;
  }
  const valuesCopy = entry.values.slice();

  if (!remove(valuesCopy, p.socket.id)) {
    Terminal.warning('Could\'t find a value matching the current socket ID');
    return undefined;
  }

  //pushes the entry back to the socketsIds list only if it's not empty
  //or user is not signing out
  //(meaning every socket on that specific device closed) 
  //-------------------------------------------------------------------
  if (!(entry.values.length === 0 && isSigningOut)) {
    await p.usersCollection.updateOne(
      { _id: userBefore._id }, //supposed to be valid, but make sure if something goes wrong
      { $push: { socketsIds: { key: entry.key, values: valuesCopy } } }
    );
  }

  //removes the user's game request, if one exists, but only if socketsIds is empty
  //(meaning the user is disconnected everywhere)
  //===============================================================================
  const userAfter = await p.usersCollection.findOne({ _id: userBefore._id });
  if (userAfter === null) return;

  if (userAfter.socketsIds.find(socketIds => socketIds.values.length > 0) === undefined) {
    if (userAfter.gameRequestId !== null) {
      p.gameRequestsCollection.deleteOne({ _id: toValidId(userAfter.gameRequestId) });
    }
    deleteOutInvitationForFriend(p, userAfter);
    p.usersCollection.updateOne(
      { _id: userAfter._id },
      { $set: { gameRequestId: null, outInvitation: null } },
    );
  }

  return userBefore;
}

export async function deleteOutInvitationForFriend(p: HandlerParams, user: WithId<User>) {
  if (user.outInvitation === null) return;

  const friendUserResult = await p.usersCollection.findOneAndUpdate(
    { _id: toValidId(user.outInvitation.friendId) },
    { $pull: { invitations: { friendId: user._id } } },
    { returnDocument: "after" }
  );
  if (friendUserResult.value === null) {
    Terminal.warning('Couldn\'t friend ID in DB');
    return;
  }
  const friendUser = friendUserResult.value;

  emitToUser(p.webSocketServer, friendUser, "gameInvitationsUpdated",
    friendUser.invitations
  );
}