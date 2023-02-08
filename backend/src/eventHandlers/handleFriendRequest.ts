import { emitToUser } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { FriendRequest as FriendRequest } from "shared/types/general";
import { ObjectId } from "mongodb";

export default function handleFriendRequest(p: HandlerParams) {
  p.socket.on("friendRequest", async (friendId, callback) => {
    callback(await (async () => {
      if (p.userId === undefined) {
        Terminal.warning('User tried to send a friend request but was not signed in');
        return false;
      }

      const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });
      if (user === null) {
        Terminal.error('User with saved user ID could not be found in DB');
        return false;
      }
      if (user.data.email === undefined) {
        Terminal.warning('User doesn\'t have an email');
        return false;
      }
      if (user.data.picture === undefined) {
        Terminal.warning('User doesn\'t have a picture');
        return false;
      }

      const request: FriendRequest = {
        id: user._id.toString(),
        name: user.name,
        email: user.data.email,
        picture: user.data.picture,
      }

      const friendUserResult = await p.usersCollection.findOneAndUpdate(
        { _id: new ObjectId(friendId) },
        { $push: { friendRequests: request } },
        { returnDocument: "after" }
      );
      if (friendUserResult.value === null) {
        Terminal.warning('Friend ID to send a request to was not found in DB');
        return false;
      }
      const friendUser = friendUserResult.value;

      emitToUser(p, friendUser, "friendRequestsUpdated", friendUser.friendRequests);

      return true;
    })());
  });
}