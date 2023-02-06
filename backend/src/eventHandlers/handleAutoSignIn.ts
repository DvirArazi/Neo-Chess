import { emitToUser, toValidId } from "backend/src/eventHandlers/handlerTools";
import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export function handleAutoSignIn(p: HandlerParams) {
  p.socket.on("autoSignIn", async (aad) => {
    const userBeforeResult = await p.usersCollection.findOneAndUpdate(
      {
        _id: toValidId(aad.id),
        aadKeys: aad.key,
      },
      { $pull: { socketIds: { key: aad.key } } },
      { returnDocument: "before" }
    );
    if (userBeforeResult.value === null) {
      Terminal.warning('User tried to auto sign in with an invalid AAD');
      p.socket.emit("signedOut");
      return;
    }
    const userBefore = userBeforeResult.value;

    const valuesOld = userBefore.aadKeys.find(key => key === aad.key);

    const userAfterResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(aad.id), },
      { $push: { socketIds: p.socket.id } },
      { returnDocument: "after" }
    );
    if (userAfterResult.value === null) {
      Terminal.warning('Could not find user. Somehow...?');
      return;
    }
    const userAfter = userAfterResult.value;

    p.userId = aad.id;

    emitToUser(p, userAfter, "autoSignedIn", { name: userAfter.name, picture: userAfter.data.picture });
  });
}