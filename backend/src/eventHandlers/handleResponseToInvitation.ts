import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { generateStart, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { timeframeToTimeFormat } from "shared/tools/general";
import { boardLayoutToRep } from "shared/tools/rep";
import { GameStatusCatagory, Player } from "shared/types/game";
import { v4 as uuidv4 } from 'uuid';

export default function handleResponseToInvitation(p: HandlerParams) {
  p.socket.on("responseToInvitation", async (friendId, isAccepted) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to responed to an invitation but was not signed in');
      return;
    }

    const userResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(p.userId) },
      { $pull: { invitations: { friendId: toValidId(friendId) } } },
      { returnDocument: "after" },
    );
    if (userResult.value === null) {
      Terminal.error('User with saved ID could not be found in the DB');
      return;
    }
    const user = userResult.value;

    emitToUser(p, user, "gameInvitationsUpdated", user.invitations);

    const friendUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(friendId) },
      { $set: { outInvitation: null } },
      { returnDocument: "before" },
    );
    if (friendUserResult.value === null) {
      Terminal.warning('friendId provided was not found in DB');
      return;
    }
    const friendUser = friendUserResult.value;

    if (friendUser.outInvitation === null) return;

    emitToUser(p, friendUser, "gameRequestUpdated", null);

    if (!isAccepted) return;

    const isRated = friendUser.outInvitation.isRated;
    const timeframe = friendUser.outInvitation.timeframe;
    const timeFormat = timeframeToTimeFormat(timeframe);
    const player0: Player = {
      id: user._id,
      name: user.name,
      rating: user.ratings[timeFormat]
    }
    const player1: Player = {
      id: friendUser._id,
      name: friendUser.name,
      rating: friendUser.ratings[timeFormat]
    }
    const start = generateStart();
    const isUser0White = Math.random() < 0.5;
    const path = uuidv4();
    p.ongoingGamesCollection.insertOne({
      path: path,
      white: isUser0White ? player0 : player1,
      black: isUser0White ? player1 : player0,
      timeframe: timeframe,
      isRated: isRated,
      start: start,
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
      turns: [],
      timeLastTurnMs: new Date().getTime(),
      status: { catagory: GameStatusCatagory.Ongoing },
      timeoutId: null
    });
  });
}
