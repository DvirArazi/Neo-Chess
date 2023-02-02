import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { toValidId } from "backend/src/utils/tools/general";

export default function handleGetFriends(p: HandlerParams) {
  p.socket.on("getFriends", async (callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to get friends but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: toValidId(p.userId) });
    if (user === null) {
      console.log('Saved user ID was not found in DB');
      return;
    }

    callback(user.friends);
  });
}