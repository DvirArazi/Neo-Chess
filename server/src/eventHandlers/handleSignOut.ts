import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export function HandleSignOut(p: HandlerParams) {
p.socket.on("signOut", async (aad)=>{
  const user = await p.usersCollection.findOneAndUpdate(
    { _id: aad.id },
    { $pull: { keys: aad.key } },
    { upsert: true }
  );

  if (user.value === null) {
    Terminal.warning("User signed out with an invalid ID");
  }

  p.socket.emit("signedOut");
});
}