import { Server } from "socket.io";

export interface ServerToClientEvents {
    opponentMoved: (from: Point, to: Point)=> void;
}
export interface ClientToServerEvents {
    playerMoved: (from: Point, to: Point) => void;
}

type Point = {
    x: number,
    y: number,
}