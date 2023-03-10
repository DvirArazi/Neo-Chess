import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { ObjectId } from "mongodb";

export default function handleGetHomeData(p: HandlerParams) {
  p.socket.on("getHomeData", async (callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User requested home data, but was not signed in');
      return;
    }

    const user = await p.usersCollection.findOne({ _id: new ObjectId(p.userId) });

    if (user === null) {
      Terminal.warning('User requested home data, but couldn\'t be found in DB');
      return;
    }

    callback(user.ratings);
  });
}