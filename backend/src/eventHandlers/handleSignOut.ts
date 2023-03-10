// import { leave } from "backend/src/eventHandlers/handlerTools";
import { leave } from "backend/src/utils/tools/general";
import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export function handleSignOut(p: HandlerParams) {
  p.socket.on("signOut", async (aad) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to sign out but was not signed in');
      return;
    }

    const userBeforeResult = await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(p.userId) },
      {
        $pull: { socketIds: p.socket.id, aads: aad.key },
      },
      { returnDocument: "before" }
    );
    if (userBeforeResult.value === null) {
      Terminal.error('Saved ID could not be found in DB');
      return;
    }
    const userBefore = userBeforeResult.value;

    leave(p, userBefore._id.toString());

    p.userId = undefined;

    p.socket.emit("signedOut");
  });
}