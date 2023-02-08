import { emitToUser } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { ObjectId } from "mongodb";
import usersSetOutInvitation from "backend/src/collectionOperations/usersSetOutInvitation";
import usersPushInvitations from "backend/src/collectionOperations/usersPushInvitations";

export default function handleSendGameInvitation(p: HandlerParams) {
  p.socket.on("sendGameInvitation", async (timeframe, isRated, friendId, callback) => {
    callback(await (async (): Promise<boolean> => {
      if (p.userId === undefined) {
        Terminal.warning('User tried to send a game invitation but was not signed in');
        return false;
      }

      const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });
      if (user === null) {
        Terminal.error('User with saved ID was not found in the DB');
        return false;
      }

      const friendUser = await p.usersCollection.findOne({ _id: new ObjectId(friendId) });
      if (friendUser === null) {
        Terminal.warning('Friend ID was not found in DB');
        return false;
      }

      if (!await usersSetOutInvitation(p, p.userId, {
        friendId: friendId,
        friendName: friendUser.name,
        timeframe: timeframe,
        isRated: isRated,
      })) return false;

      if (!await usersPushInvitations(p, friendId, {
        friendId: p.userId,
        friendName: user.name,
        timeframe: timeframe,
        isRated: isRated,
      })) return false;

      return true;
    })());
  });
}