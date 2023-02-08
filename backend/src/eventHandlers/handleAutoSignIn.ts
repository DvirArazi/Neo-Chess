import { emitToUser} from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export function handleAutoSignIn(p: HandlerParams) {
  p.socket.on("autoSignIn", async (aad) => {
    const userBefore = (await p.usersCollection.findOneAndUpdate(
      {
        _id: new ObjectId(aad.id),
        aadKeys: aad.key,
      },
      { $pull: { socketIds: { key: aad.key } } },
      { returnDocument: "before" }
    )).value;
    if (userBefore === null) {
      Terminal.warning('User tried to auto sign in with an invalid AAD');
      p.socket.emit("signedOut");
      return;
    }

    const userAfter = (await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(aad.id), },
      { $push: { socketIds: p.socket.id } },
      { returnDocument: "after" }
    )).value;
    if (userAfter === null) {
      Terminal.warning('Could not find user. Somehow...?');
      return;
    }

    p.userId = aad.id;

    emitToUser(p, userAfter, "autoSignedIn", { name: userAfter.name, picture: userAfter.data.picture });
  });
}