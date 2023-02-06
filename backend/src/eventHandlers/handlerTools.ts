import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { User } from "backend/src/utils/types";
import { WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { ServerToClientEvents } from "shared/types/webSocket";
import { EventNames, EventParams, EventsMap } from "socket.io/dist/typed-events";

export function emitToUser<Ev extends EventNames<ServerToClientEvents>>(
  p: HandlerParams,
  user: User,
  ev: Ev,
  ...args: EventParams<ServerToClientEvents, Ev>
) {
  for (const socketId of user.socketIds) {
    if (socketId === null) continue;

    Terminal.log(`Emitting ${ev} to ${user.name} (${socketId})`);

    p.webSocketServer.to(socketId).emit(ev, ...args);
  }
}

export function toValidId(id: ObjectId) {
  return new ObjectId(id.toString());
}

export async function leave(p: HandlerParams, userId: ObjectId) {

  const user = await p.usersCollection.findOne({ _id: toValidId(userId) });
  if (user === null) return;

  if (user.socketIds.length !== 0) return;

  deleteGameRequestOnDB(p, user);
  deleteOutInvitationForFriend(p, user);

  p.usersCollection.updateOne(
    { _id: user._id },
    { $set: { gameRequestId: null, outInvitation: null } },
  );
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

  emitToUser(p, friendUser, "gameInvitationsUpdated",
    friendUser.invitations
  );
}

export function deleteGameRequestOnDB(p: HandlerParams, user: WithId<User>) {
  if (user.gameRequestId !== null) {
    p.gameRequestsCollection.deleteOne({ _id: toValidId(user.gameRequestId) });
  }
}