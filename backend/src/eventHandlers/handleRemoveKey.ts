import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { ObjectId } from "mongodb";

export default function removeKey(p: HandlerParams) {
  p.socket.on("removeKey", async (aad) => {
    const result = await p.usersCollection.updateOne(
      { _id: new ObjectId(aad.id) },
      { $pull: { socketIds: { key: aad.key } } },
    );

    if (result.modifiedCount <= 0) {
      Terminal.warning('User tried to remove a non-existent key');
    }
  });
};