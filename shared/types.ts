import { Server } from "socket.io";

export interface ServerToClientEvents {
    opponentMoved: (from: Point, to: Point)=> void;
}
export interface ClientToServerEvents {
    playerMoved: (from: Point, to: Point) => void;
    openGameRequest: (clock: Clock, onCreated: (gameId: string)=>void) => void;
}

type Point = {
    x: number,
    y: number,
}

export type Clock = {
    time: number,
    increment: number,
}