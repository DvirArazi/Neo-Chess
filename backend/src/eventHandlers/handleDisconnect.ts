import leave from "backend/src/eventHandlers/handlerTools";
import { HandlerParams } from "../handleSocket";

export function handleDisconnect(p: HandlerParams) {
  p.socket.on("disconnect", async () => {
    leave(p, false);
  });
}