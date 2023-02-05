import { Collection, ObjectId } from "mongodb";
import { ServerToClientEvents } from "shared/types/webSocket";
import { EventNames, EventParams, EventsMap } from "socket.io/dist/typed-events";
import { Terminal } from "../terminal";
import { User, WebSocketServer } from "../types";

export function emitToUser<Ev extends EventNames<ServerToClientEvents>>(
  webSocketServer: WebSocketServer,
  user: User,
  ev: Ev,
  ...args: EventParams<ServerToClientEvents, Ev>
) {
  user.socketsIds.forEach((socketId) => {
    Terminal.log(`Emitting ${ev} to {${socketId.key}, ${socketId.values}}`);
    webSocketServer.to(socketId.values).emit(ev, ...args);
  });
}

export function toValidId(id: ObjectId) {
  return new ObjectId(id.toString());
}