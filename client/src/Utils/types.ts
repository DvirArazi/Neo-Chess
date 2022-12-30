import { ClientToServerEvents, ServerToClientEvents } from "shared/rpcTypes";
import { Socket } from "socket.io-client";

type RpcClient = Socket<
    ServerToClientEvents,
    ClientToServerEvents
>;

export default RpcClient;