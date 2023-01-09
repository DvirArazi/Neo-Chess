import { ObjectId } from "mongodb";
import { ServerToClientEvents } from "shared/types/webSocketTypes";
import { EventNames, EventParams, EventsMap } from "socket.io/dist/typed-events";
import { Terminal } from "./terminal";
import { User, WebSocketServer } from "./types";

export function emitToUser<Ev extends EventNames<ServerToClientEvents>>(
  webSocketServer: WebSocketServer,
  user: User,
  ev: Ev,
  ...args: EventParams<ServerToClientEvents, Ev>
) {
  //create key-value pairs of key and socketId
  //when user auto signs in,
  //find the key and assign the new SocketId as its value
  //when sending here, send to all the values
  user.socketsIds.forEach((socketId) => {
    Terminal.log(`Emmiting ${ev} to {${socketId.key}, ${socketId.value}`);
    webSocketServer.to(socketId.value).emit(ev, ...args);
  });
}

export function toValidId(id: ObjectId) {
  return new ObjectId(id.toString());
}