import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { toValidId } from "backend/src/utils/tools/general";
import { Friend } from "shared/types/general";

export default function handleGetFriends(p: HandlerParams) {
  p.socket.on("getFriends", async (callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get friends but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user === null) {
      Terminal.error('Saved user ID was not found in DB');
      return;
    }

    const friendUsers: Friend[] = (await p.usersCollection.find({
      _id: { $in: user.friends.map(friend => toValidId(friend.id)) }
    }).toArray())
      // .filter(friendUser => friendUser.socketsIds.length !== 0)
      .map(friendUser => ({
        id: friendUser._id,
        name: friendUser.name,
        picture: friendUser.data.picture,
      }));

    callback(friendUsers);
  });
}