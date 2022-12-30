import { ClientToServerEvents, ServerToClientEvents } from "shared/rpcTypes";
import { Server } from "socket.io";

type RpcServer = Server<
    ClientToServerEvents,
    ServerToClientEvents
>;

export default RpcServer;