import { BackendParams, HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { User } from "backend/src/utils/types";
import { WithId } from "mongodb";
import { ObjectId } from "mongodb";
import { turnsToColor } from "shared/tools/board";
import { startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { timeframeToTimeFormat } from "shared/tools/general";
import { GameStatus, GameStatusCatagory } from "shared/types/game";
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

  const disconnectedSocketIds: string[] = [];
  for (const id of user.socketIds) {
    if (p.webSocketServer.of('/').sockets.get(id) === undefined) {
      disconnectedSocketIds.push(id);
    }
  }
  p.usersCollection.updateOne(
    { _id: user._id },
    {$pull: {socketIds: {$in: disconnectedSocketIds}}},
  );

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
    Terminal.warning('Couldn\'t find friend ID in DB');
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
    const game = await p.gamesCollection.findOne({ _id: new ObjectId(gameId) });
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

export async function handleGameUpdate(
  p: BackendParams,
  gameId: string,
) {
  const game = (await p.gamesCollection.findOneAndUpdate(
    { _id: new ObjectId(gameId) },
    { $set: { drawOffer: null, takeback: null } }
  )).value;
  if (game === null) {
    Terminal.warning('Game ID provided was not found in DB');
    return;
  }

  const whiteUser = await p.usersCollection.findOne({ _id: new ObjectId(game.white.id) });
  if (whiteUser === null) { Terminal.error('User with ID saved in game was not found in DB'); return; }
  const blackUser = await p.usersCollection.findOne({ _id: new ObjectId(game.black.id) });
  if (blackUser === null) { Terminal.error('User with ID saved in game was not found in DB'); return; }

  if (game.status.catagory !== GameStatusCatagory.Ongoing) {
    if (game.isRated) {
      const tfn = timeframeToTimeFormat(game.timeframe) as number;
      const result = game.status.catagory === GameStatusCatagory.Draw ? 0.5 :
        (game.status.winColor === PieceColor.White ? 1 : 0);
      const { newRating0, newRating1 } = getNewRatings(whiteUser.ratings[tfn], blackUser.ratings[tfn], result);

      p.gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        {
          $set: {
            viewerSocketIds: [],
            "white.ratingMod": newRating0 - whiteUser.ratings[tfn],
            "black.ratingMod": newRating1 - blackUser.ratings[tfn],
          }
        }
      );

      updateUserWithRatings(whiteUser, newRating0, tfn, newRating0, newRating1);
      updateUserWithRatings(blackUser, newRating1, tfn, newRating0, newRating1);
    } else {
      p.gamesCollection.updateOne(
        { _id: new ObjectId(gameId) },
        { $set: { viewerSocketIds: [] } }
      );

      updateUser(whiteUser);
      updateUser(blackUser);
    }

    return;
  }

  emitToUser(p, whiteUser, "ongoingGamesUpdated", await getOngoingGamesTd(p, whiteUser));
  emitToUser(p, blackUser, "ongoingGamesUpdated", await getOngoingGamesTd(p, blackUser));

  async function updateUser(user: WithId<User>) {
    const userAfter = (await p.usersCollection.findOneAndUpdate(
      { _id: user._id },
      {
        $pull: { ongoingGamesIds: gameId },
        $push: { historyGamesIds: gameId },
      },
      { returnDocument: "after" }
    )).value;
    if (userAfter === null) return;

    emitToUser(p, userAfter, "ongoingGamesUpdated", await getOngoingGamesTd(p, userAfter));
  }

  async function updateUserWithRatings(
    user: WithId<User>,
    newRating: number,
    tfn: number,
    whiteRating: number,
    blackRating: number,
  ) {
    const newRatings = user.ratings;
    newRatings[tfn] = newRating;

    const userAfter = (await p.usersCollection.findOneAndUpdate(
      { _id: user._id },
      {
        $pull: { ongoingGamesIds: gameId },
        $push: { historyGamesIds: gameId },
        $set: { ratings: newRatings }
      },
      { returnDocument: "after" }
    )).value;
    if (userAfter === null) return;

    emitToUser(p, userAfter, "ongoingGamesUpdated", await getOngoingGamesTd(p, userAfter));
    emitToUser(p, userAfter, "ratingsUpdated", gameId, whiteRating, blackRating);
  }
}

export function getNewRatings(
  rating0: number, rating1: number, result: number,
): { newRating0: number, newRating1: number } {
  const k = 16;

  const e0 = 1 / (1 + 10 ** ((rating0 - rating1) / 400));
  const e1 = 1 / (1 + 10 ** ((rating1 - rating0) / 400));

  return {
    newRating0: rating0 + k * (result - e0),
    newRating1: rating1 + k * ((1 - result) - e1)
  };
}