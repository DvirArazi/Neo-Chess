import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";

export default function handleResponseToFriendRequest(p: HandlerParams) {
  p.socket.on("responseToFriendRequest", async (friendId, isAccepted) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to respond to a friend request but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user === null) {
      Terminal.error('Saved user ID was not found in DB');
      return;
    }

    const friendUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(friendId) },
      isAccepted ? {
        $push: {
          friends: {
            id: user._id,
            name: user.name,
            picture: user.data.picture
          }
        },
      } : {}
    );
    if (friendUserResult.value === null) {
      Terminal.warning('Friend ID to apprpve/deny was not found in DB');
      return;
    }
    const friendUser = friendUserResult.value;

    p.usersCollection.updateOne(
      { _id: user._id },
      isAccepted ? {
        $push: {
          friends: {
            id: friendUser._id,
            name: friendUser.name,
            picture: friendUser.data.picture
          }
        },
        $pull: { friendRequests: { id: friendUser._id } }
      } : {
        $pull: { friendRequests: { id: friendUser._id } }
      }
    );

    emitToUser(p.webSocketServer, user, "friendsUpdated", user.friends);
    emitToUser(p.webSocketServer, friendUser, "friendsUpdated", friendUser.friends);
  });
}