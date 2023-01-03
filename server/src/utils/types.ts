import { ClientToServerEvents, ServerToClientEvents } from "shared/types";
import { Server } from 'socket.io';

export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

export type Game = {
    white: string,
    black: string,
}

export type GameRequest = {

}