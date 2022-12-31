import { ClientToServerEvents, ServerToClientEvents } from "shared/types";
import { Server } from 'socket.io';

type RpcServer = Server<
    ClientToServerEvents,
    ServerToClientEvents
>;

export default RpcServer;