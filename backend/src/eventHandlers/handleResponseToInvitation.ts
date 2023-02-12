import { emitToUser } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { generateStart, startAndTurnsToBoardLayout } from "shared/tools/boardLayout";
import { timeframeToTimeFormat } from "shared/tools/general";
import { boardLayoutToRep } from "shared/tools/rep";
import { GameStatusCatagory, Player } from "shared/types/game";
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from "mongodb";
import ongoingGamesInsert from "backend/src/collectionOperations/ongoingGamesInsert";

export default function handleResponseToInvitation(p: HandlerParams) {
  p.socket.on("responseToInvitation", async (friendId, isAccepted) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to responed to an invitation but was not signed in');
      return;
    }


    const userResult = await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(p.userId) },
      { $pull: { invitations: { friendId: friendId } } },
      { returnDocument: "after" },
    );
    if (userResult.value === null) {
      Terminal.error('User with saved ID could not be found in the DB');
      return;
    }
    const user = userResult.value;

    emitToUser(p, user, "gameInvitationsUpdated", user.invitations);

    const friendUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(friendId) },
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

    const isUser0White = Math.random() < 0.5;
    const timeframe = friendUser.outInvitation.timeframe;
    const timeFormat = timeframeToTimeFormat(timeframe);
    const player0: Player = {
      id: user._id.toString(),
      name: user.name,
      rating: user.ratings[timeFormat]
    }
    const player1: Player = {
      id: friendUser._id.toString(),
      name: friendUser.name,
      rating: friendUser.ratings[timeFormat]
    }
    const start = generateStart();
    ongoingGamesInsert(p, {
      path: uuidv4(),
      white: isUser0White ? player0 : player1,
      black: isUser0White ? player1 : player0,
      viewerSocketIds: [],
      timeframe: timeframe,
      isRated: friendUser.outInvitation.isRated,
      start: start,
      startRep: boardLayoutToRep(startAndTurnsToBoardLayout(start, [])),
      turns: [],
      timeLastTurnMs: new Date().getTime(),
      status: { catagory: GameStatusCatagory.Ongoing },
      timeoutId: null
    });
  });
}
