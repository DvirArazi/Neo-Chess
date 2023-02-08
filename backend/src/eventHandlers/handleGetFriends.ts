import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { ObjectId } from "mongodb";
import { Friend } from "shared/types/general";

export default function handleGetFriends(p: HandlerParams) {
  p.socket.on("getFriends", async (callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get friends but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });
    if (user === null) {
      Terminal.error('Saved user ID was not found in DB');
      return;
    }

    const friendUsers: Friend[] = (await p.usersCollection.find({
      _id: { $in: user.friends.map(friend => new ObjectId(friend.id)) }
    }).toArray())
      .map(friendUser => ({
        id: friendUser._id.toString(),
        name: friendUser.name,
        picture: friendUser.data.picture,
      }));

    callback(friendUsers);
  });
}