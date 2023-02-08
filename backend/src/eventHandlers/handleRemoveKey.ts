import { toValidId } from "backend/src/utils/tools/general";
import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";

export default function removeKey(p: HandlerParams) {
  p.socket.on("removeKey", async (aad) => {
    const result = await p.usersCollection.updateOne(
      { _id: toValidId(aad.id) },
      { $pull: { socketIds: { key: aad.key } } },
    );

    if (result.modifiedCount <= 0) {
      Terminal.warning('User tried to remove a non-existent key');
    }
  });
};