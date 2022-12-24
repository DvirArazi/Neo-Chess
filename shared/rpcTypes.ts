import { Server } from "socket.io";

export interface ServerToClientEvents {
    blue: () => void;
}
export interface ClientToServerEvents {
    bla: () => void;
}

export type RpcServer = Server<
    ClientToServerEvents,
    ServerToClientEvents
>;