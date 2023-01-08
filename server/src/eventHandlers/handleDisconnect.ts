import { ObjectId } from "mongodb";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";

export function HandleDisconnect(p: HandlerParams) {
  p.socket.on("disconnect", async (aad)=>{
    if (p.userId === undefined) {
      return;
    }
    
    const user = await p.usersCollection.findOneAndUpdate(
      { _id: new ObjectId(p.userId.toString()) },
      {
        $pull: { socketIds: p.socket.id },
        $set: { gameRequestId: undefined },
      },
      { upsert: false }
    );
    
    if (user.value === null) {
      Terminal.error('Could not find a user in the database with the saved ID');
      return;
    }
    
    const gameRequestId = user.value.gameRequestId;
    
    if (gameRequestId !== undefined) {
      p.gameRequestsCollection.deleteOne({ _id: gameRequestId });
    }
  });
  }