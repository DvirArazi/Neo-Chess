import { HandlerParams } from "backend/src/handleSocket";
import { Terminal } from "backend/src/utils/terminal";
import { toValidId } from "backend/src/utils/tools";

export default function removeKey(p: HandlerParams) {
  p.socket.on("removeKey", async (aad) => {
    const result = await p.usersCollection.updateOne(
      { _id: toValidId(aad.id) },
      { $pull: { socketsIds: { key: aad.key } } },
    );

    if (result.modifiedCount <= 0) {
      Terminal.warning('User tried to remove a non-existent key');
    }
  });
};