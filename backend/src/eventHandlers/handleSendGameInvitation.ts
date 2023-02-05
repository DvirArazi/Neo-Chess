import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";

export default function handleSendGameInvitation(p: HandlerParams) {
  p.socket.on("sendGameInvitation", async (timeframe, isRated, friendId, callback) => {
    callback(await (async (): Promise<boolean> => {
      if (p.userId === undefined) {
        Terminal.warning('User tried to send a game invitation but was not signed in');
        return false;
      }

      const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
      if (user === null) {
        Terminal.error('User with saved ID was not found in the DB');
        return false;
      }

      const friendUserResult = await p.usersCollection.findOneAndUpdate(
        { _id: toValidId(friendId) },
        {
          $push: {
            invitations: {
              friendId: user._id,
              name: user.name,
              timeframe: timeframe,
              isRated: isRated,
            }
          }
        },
        { returnDocument: "after" }
      );
      if (friendUserResult.value === null) {
        Terminal.warning('friendId provided was not found in DB');
        return false;
      }
      const friendUser = friendUserResult.value;

      emitToUser(p.webSocketServer, friendUser, "gameInvitationsUpdated",
        friendUser.invitations
      );

      emitToUser(p.webSocketServer, user, "gameRequestUpdated", {
        timeframe: timeframe,
        isRated: isRated,
        isByRating: false,
        opponentName: friendUser.name,
      })

      return true;
    })());
  });
}