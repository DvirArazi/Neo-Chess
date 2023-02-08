import { deleteOutInvitationForFriend, toValidId } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";

export default function handleDeleteGameRequest(p: HandlerParams) {
  p.socket.on("deleteGameRequest", async (callback) => {
    if (p.userId === undefined) {
      Terminal.warning('User tried to delete a game request but was not signed in');
      return;
    }

    const userResult = await p.usersCollection.findOneAndUpdate(
      { _id: toValidId(p.userId) },
      { $set: { gameRequestId: null, outInvitation: null } },
      { returnDocument: "before" }
    );
    if (userResult.value === null) {
      Terminal.error('Couldn\'t find user with saved ID in DB');
      return;
    }
    const user = userResult.value;

    if (user.gameRequestId !== null) {
      p.gameRequestsCollection.findOneAndDelete(
        { _id: toValidId(user.gameRequestId) }
      );
    }
    deleteOutInvitationForFriend(p, user);



    callback();
  });
}