import { emitToUser } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { ObjectId } from "mongodb";

export default function handleDeleteFriend(p: HandlerParams) {
  p.socket.on("deleteFriend", async (friendId) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get friends but was not signed in');
      return;
    }

    const userResult = await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(p.userId) },
      { $pull: { friends: { id: friendId } } },
      { returnDocument: "after" }
    );
    if (userResult.value === null) {
      Terminal.log('Saved user ID was not found in DB');
      return;
    }
    const user = userResult.value;

    const friendUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(friendId) },
      { $pull: { friends: { id: p.userId } } },
      { returnDocument: "after" }
    );
    if (friendUserResult.value === null) {
      Terminal.log('Friend ID was not found in DB');
      return;
    }
    const friendUser = friendUserResult.value;

    emitToUser(p, user, "friendsUpdated", user.friends);
    emitToUser(p, friendUser, "friendsUpdated", friendUser.friends);
  });
}