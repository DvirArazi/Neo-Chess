import { deleteGameRequestOnDB, deleteOutInvitationForFriend, leave, toValidId } from "backend/src/utils/tools/general";
import { Terminal } from "backend/src/utils/terminal";
import { HandlerParams } from "../handleSocket";

export function handleDisconnect(p: HandlerParams) {
  p.socket.on("disconnect", async () => {
    if (p.userId === undefined) {
      return;
    }

    const userBeforeResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(p.userId) },
      {
        $pull: { socketIds: p.socket.id },
      },
      { returnDocument: "before" }
    );
    if (userBeforeResult.value === null) {
      Terminal.error('Saved ID could not be found in DB');
      return;
    }
    const userBefore = userBeforeResult.value;

    leave(p, userBefore._id);
  });
}