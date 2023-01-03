import { TokenPayload } from "google-auth-library";
import { Server } from "socket.io";

export interface ServerToClientEvents {
    opponentMoved: (from: Point, to: Point) => void;
    authenticated: (data: TokenPayload) => void;
}
export interface ClientToServerEvents {
    playerMoved: (from: Point, to: Point) => void;
    openGameRequest: (tid: string, clock: Clock, onCreated: (gameId: string)=>void) => void;
    authenticate: (tid: string) => void;
}

type Point = {
    x: number,
    y: number,
}

export type Clock = {
    time: number,
    increment: number,
}