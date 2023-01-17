import leave from "backend/src/eventHandlers/handlerTools";
import { remove } from "shared/tools/general";
import { HandlerParams } from "../handleSocket";
import { Terminal } from "../utils/terminal";
import { emitToUser, toValidId } from "../utils/tools/general";

export function HandleSignOut(p: HandlerParams) {
  p.socket.on("signOut", async () => {
    const user = await leave(p, true);

    if (user !== undefined) {
      emitToUser(p.webSocketServer, user, "signedOut");
    }

    p.userId = undefined;
  });
}