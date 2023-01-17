import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { emitToUser, toValidId } from "../utils/tools/general";

export function HandleAutoSignIn(p: HandlerParams) {
  p.socket.on("autoSignIn", async (aad) => {
    Terminal.log(`aad: ${aad.id}, ${aad.key}`);
    Terminal.log(`current socket.id: ${p.socket.id}`);
    const userBeforeResult = await p.usersCollection.findOneAndUpdate(
      {
        _id: toValidId(aad.id),
        socketsIds: { $elemMatch: { key: aad.key } },
      },
      { $pull: { socketsIds: { key: aad.key } } },
      { returnDocument: "before" }
    );
    if (userBeforeResult.value === null) {
      Terminal.warning('User tried to auto sign in with an invalid AAD');
      return;
    }
    const userBefore = userBeforeResult.value;

    const valuesOld = userBefore.socketsIds.find((entry) => { entry.key === aad.key });

    const userAfter = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(aad.id), },
      { $push: { socketsIds: { key: aad.key, values: [p.socket.id] } } },
      { returnDocument: "after" }
    );
    if (userAfter.value === null) {
      Terminal.warning('Could not find user. Somehow...?');
      return;
    }

    p.userId = aad.id;

    emitToUser(p.webSocketServer, userAfter.value, "autoSignedIn", userBeforeResult.value.data);
  });
}