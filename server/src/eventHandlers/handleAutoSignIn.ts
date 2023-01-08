import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { emitToUser, toValidId } from "../utils/tools";

export function HandleAutoSignIn(p: HandlerParams) {
  p.socket.on("autoSignIn", async (aad) => {
    Terminal.log(`aad: ${aad.id}, ${aad.key}`);
    Terminal.log(`current socket.id: ${p.socket.id}`);
    const userOld = await p.usersCollection.findOneAndUpdate(
      {
        _id: toValidId(aad.id),
        socketsIds: { $elemMatch: { key: aad.key } },
      },
      { $pull: { socketsIds: { key: aad.key } } },
      { returnDocument: "after" }
    );
    if (userOld.value === null) {
      Terminal.warning('User tried to auto sign in with an invalid AAD');
      return;
    }
    const user = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(aad.id), },
      { $push: { socketsIds: { key: aad.key, value: p.socket.id } } },
      { returnDocument: "after" }
    );
    if (user.value === null) {
      Terminal.warning('Could not find user. Somehow...?');
      return;
    }

    p.userId = aad.id;

    emitToUser(p.webSocketServer, user.value, "autoSignedIn", userOld.value.data);
  });
}