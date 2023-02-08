import { emitToUser, toValidId } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";

export default function handleResponseToFriendRequest(p: HandlerParams) {
  p.socket.on("responseToFriendRequest", async (friendId, isAccepted) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to respond to a friend request but was not signed in');
      return;
    }

    const userResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(p.userId) },
      { $pull: { friendRequests: { id: toValidId(friendId) } } },
      { returnDocument: "after" }
    );
    if (userResult.value === null) {
      Terminal.error('Saved user ID was not found in DB');
      return;
    }
    const user = userResult.value;

    emitToUser(p, user, "friendRequestsUpdated", user.friendRequests);

    if (!isAccepted) return;


    const friendUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(friendId) },
      {
        $push: {
          friends: {
            id: user._id,
            name: user.name,
            picture: user.data.picture
          }
        },
      },
      { returnDocument: "after" }
    );
    if (friendUserResult.value === null) {
      Terminal.warning('Friend ID to approve/deny was not found in DB');
      return;
    }
    const friendUser = friendUserResult.value;

    const updatedUserResult = await p.usersCollection.findOneAndUpdate(
      { _id: user._id },
      {
        $push: {
          friends: {
            id: friendUser._id,
            name: friendUser.name,
            picture: friendUser.data.picture
          }
        },
      },
      { returnDocument: "after" }
    );
    if (updatedUserResult.value === null) {
      Terminal.error('This really should never happen');
      return;
    }
    const updatedUser = updatedUserResult.value;

    emitToUser(p, updatedUser, "friendsUpdated", updatedUser.friends);
    emitToUser(p, friendUser, "friendsUpdated", friendUser.friends);
  });
}