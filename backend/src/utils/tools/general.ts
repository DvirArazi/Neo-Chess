import { BackendParams, HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { User } from "backend/src/utils/types";
import { WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { turnsToColor } from "shared/tools/board";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { GameTd } from "shared/types/general";
import { PieceColor } from "shared/types/piece";
import { ServerToClientEvents } from "shared/types/webSocket";
import { EventNames, EventParams, EventsMap } from "socket.io/dist/typed-events";

export function emitToUser<Ev extends EventNames<ServerToClientEvents>>(
  p: BackendParams,
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

export async function leave(p: HandlerParams, userId: string) {

  const user = await p.usersCollection.findOne({ _id: new ObjectId(userId) });
  if (user === null) return;

  if (user.socketIds.length !== 0) return;

  deleteGameRequestOnDB(p, user);
  deleteOutInvitationForFriend(p, user);

  p.usersCollection.updateOne(
    { _id: user._id },
    { $set: { gameRequestId: null, outInvitation: null } },
  );
}

export async function deleteOutInvitationForFriend(p: BackendParams, user: WithId<User>) {
  if (user.outInvitation === null) return;

  const friendUserResult = await p.usersCollection.findOneAndUpdate(
    { _id: new ObjectId(user.outInvitation.friendId) },
    { $pull: { invitations: { friendId: user._id.toString() } } },
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
    p.gameRequestsCollection.deleteOne({ _id: new ObjectId(user.gameRequestId) });
  }
}

export async function getOngoingGamesTd(p: BackendParams, user: WithId<User>) {
  let gamesTd: GameTd[] = [];
  for (const gameId of user.ongoingGamesIds) {
    const game = await p.ongoingGamesCollection.findOne({ _id: new ObjectId(gameId) });
    if (game === null) {
      Terminal.error('Game ID from the user\'s ongoingGamesIds was not found on DB');
      continue;
    }
    gamesTd.push({
      ...game,
      path: game.path,
      layout: startAndTurnsToBoardLayout(game.start, game.turns),
      turnColor: turnsToColor(game.turns),
      userColor: user._id.toString() === game.white.id.toString() ? PieceColor.White : PieceColor.Black
    });
  }

  return gamesTd;
}