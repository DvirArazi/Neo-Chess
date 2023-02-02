import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { emitToUser, toValidId } from "backend/src/utils/tools/general";

export default function handleDeleteFriend(p: HandlerParams) {
  p.socket.on("deleteFriend", async (friendId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get friends but was not signed in');
      return;
    }

    const userResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(p.userId) },
      { $pull: { friends: { id: toValidId(friendId) } } }
    );
    if (userResult.value === null) {
      Terminal.log('Saved user ID was not found in DB');
      return;
    }

    const friendUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(friendId) },
      { $pull: { friends: { id: toValidId(p.userId) } } },
      { returnDocument: "after" }
    );
    if (friendUserResult.value === null) {
      Terminal.log('Friend ID was not found in DB');
      return;
    }
    const friendUser = friendUserResult.value;

    emitToUser(p.webSocketServer, friendUser, "friendsUpdated", friendUser.friends);
  });
}