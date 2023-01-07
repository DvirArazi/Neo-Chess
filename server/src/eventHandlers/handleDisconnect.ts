import { Terminal } from "../utils/terminal";
import { HandlerParams } from "../utils/types";

export function HandleDisconnect(p: HandlerParams) {
  const {
    userId,
    socket,
    usersCollection,
    gameRequestsCollection,
  } = p;
  socket.on("disconnect", async (aad)=>{
    if (userId === undefined) {
      return;
    }
    
    const user = await usersCollection.findOneAndUpdate(
      { _id: userId },
      {
        $pull: { socketIds: socket.id },
        $set: { gameRequestId: undefined },
      }
    );
    
    if (user.value === null) {
      Terminal.error('Could not find a user in the database with the saved ID');
      return;
    }
    
    const gameRequestId = user.value.gameRequestId;
    
    if (gameRequestId !== undefined) {
      gameRequestsCollection.deleteOne({ _id: gameRequestId });
    }
  });
  }