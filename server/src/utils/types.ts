import { ClientToServerEvents, ServerToClientEvents } from "shared/types";
import { Server } from 'socket.io';

type RpcServer = Server<ClientToServerEvents, ServerToClientEvents>;
export default RpcServer;

export type Game = {
    white: string,
    black: string,
}

