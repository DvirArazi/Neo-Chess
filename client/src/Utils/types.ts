import { ClientToServerEvents, ServerToClientEvents } from "shared/types";
import { Socket } from "socket.io-client";

type RpcClient = Socket<
    ServerToClientEvents,
    ClientToServerEvents
>;

export default RpcClient;