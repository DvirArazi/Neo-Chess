import { toValidId } from "backend/src/eventHandlers/handlerTools";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { FriendRequest } from "shared/types/general";

export default function handleGetFriendsSearchData(p: HandlerParams) {
  p.socket.on("getFriendsSearchData", async (name, callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get friends search data but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user === null) {
      Terminal.error('Saved user ID couldn\'t be found in the DB');
      return;
    }

    const searchUsers = await p.usersCollection.find({
      name: { $regex: new RegExp(`^${name}`, "i") },
      _id: { $ne: toValidId(user._id) },
      // friends: { $not: { $elemMatch: { id: toValidId(user._id) } } } //still need to test this line
    }).toArray();

    const friends: FriendRequest[] = [];
    for (const searchUser of searchUsers) {
      if (searchUser.data.email === undefined) {
        Terminal.error('User does not have an email');
        continue;
      }
      if (searchUser.data.picture === undefined) {
        Terminal.error('User does not have a picture');
        continue;
      }

      if (
        [...searchUser.friends, ...searchUser.friendRequests]
          .find(friend =>
            friend.id.toString() === user._id.toString()
          )
      ) {
        continue;
      }

      friends.push({
        id: searchUser._id,
        name: searchUser.name,
        email: searchUser.data.email,
        picture: searchUser.data.picture,
      });
    }

    callback(friends);
  });
}