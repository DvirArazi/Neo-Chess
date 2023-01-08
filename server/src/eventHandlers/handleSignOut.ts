import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { emitToUser, toValidId } from "../utils/tools";

export function HandleSignOut(p: HandlerParams) {
  p.socket.on("signOut", async (aad) => {
    const user = await p.usersCollection.findOneAndUpdate(
      {
        _id: toValidId(aad.id),
        socketsIds: { $elemMatch: { key: aad.key } },
      },
      { $pull: { socketsIds: { key: aad.key} } },
      {
        returnDocument: "before",
      },
    );

    if (user.value === null) {
      Terminal.warning("User signed out with an invalid ID");
      p.socket.emit("signedOut");
      return;
    }

    for (let i = 0; i < user.value.socketsIds.length; i++) {
      Terminal.log(user.value.socketsIds[i].key);
    }

    emitToUser(p.webSocketServer, user.value, "signedOut");
  });
}