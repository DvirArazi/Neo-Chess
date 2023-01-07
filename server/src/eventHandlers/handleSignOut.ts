import { generateKeySync } from "crypto";
import { TimeFormats } from "shared/types";
import { Terminal } from "../utils/terminal";
import { HandlerParams, User } from "../utils/types";

export function HandleSignOut(p: HandlerParams) {
const {
  socket,
  usersCollection,
} = p;
socket.on("signOut", async (aad)=>{
  const user = await usersCollection.findOneAndUpdate(
    { _id: aad.id },
    { $pull: { keys: aad.key } },
    { upsert: true }
  );

  if (user.value === null) {
    Terminal.warning("User signed out with an invalid ID");
  }

  socket.emit("signedOut");
});
}