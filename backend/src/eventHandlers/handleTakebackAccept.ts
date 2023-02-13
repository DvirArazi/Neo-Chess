import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { ObjectId } from "mongodb";

export default function handleTakebackAccept(p: HandlerParams) {
  p.socket.on("takebackAccept", async (gameId)=>{
    if (p.userId === undefined) {
      Terminal.warning('User tried to accept a takeback but was not signed in');
      return;
    }

    // const game = (await p.gamesCollection.findOneAndUpdate(
    //   { _id: new ObjectId(gameId) },
    //   { $set: { status: { catagory: GameStatusCatagory.Draw, reason: DrawReason.Agreement } } }
    // )).value;
    // if (game === null) {
    //   Terminal.warning('Game ID provided by the user was not found in DB');
    //   return;
    // }
  });
}