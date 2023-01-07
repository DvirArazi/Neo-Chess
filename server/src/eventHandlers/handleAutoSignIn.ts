import { Terminal } from "../utils/terminal";
import { HandlerParams, User } from "../utils/types";

export function HandleAutoSignIn(p: HandlerParams) {
const {
  socket,
  usersCollection,
} = p;
socket.on("autoSignIn", async (aad)=>{
  const user = await usersCollection.findOne(
    { _id: aad.id, keys: { $in: [aad.key] } }
  );
  if (user === null) {
    Terminal.warning('User auto signed out with an invalid AAD');
    return;
  }

  p.userId = aad.id;

  socket.emit("autoSignedIn", (user.data));
});
}