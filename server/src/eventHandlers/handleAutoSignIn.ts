import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export function HandleAutoSignIn(p: HandlerParams) {
p.socket.on("autoSignIn", async (aad)=>{
  Terminal.log(`aad: ${aad.id}, ${aad.key}`);
  const user = await p.usersCollection.findOne(
    { 
      _id: new ObjectId(aad.id.toString()),
      keys: { $in: [aad.key] }
    }
  );
  if (user === null) {
    Terminal.warning('User auto signed out with an invalid AAD');
    return;
  }

  p.userId = aad.id;

  p.socket.emit("autoSignedIn", (user.data));
});
}