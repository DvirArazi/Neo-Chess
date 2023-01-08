import { ObjectId } from "mongodb";
import { BOARD_SIDE } from "shared/globals";
import { PieceColor, PieceData, PieceType } from "shared/pieceData";
import { ServerToClientEvents } from "shared/types";
import { EventNames, EventParams, EventsMap } from "socket.io/dist/typed-events";
import { Terminal } from "./terminal";
import { User, WebSocketServer } from "./types";

export function generateBoardLayout() {
  const layout = Array<PieceData | undefined>(BOARD_SIDE * BOARD_SIDE).fill(undefined);

  layout[Math.floor(Math.random() * 4) * 2] = { type: PieceType.Bishop, color: PieceColor.White };
  layout[Math.floor(Math.random() * 4) * 2 + 1] = { type: PieceType.Bishop, color: PieceColor.White };

  const pieceTypes = [
    PieceType.King,
    PieceType.Queen,
    PieceType.Knight,
    PieceType.Knight,
  ];

  for (let pieceI = 0; pieceI < pieceTypes.length; pieceI++) {
    let goal = Math.floor(Math.random() * (6 - pieceI));
    let steps = 0;
    for (let position = 0; position < BOARD_SIDE; position++) {
      if (layout[position] === undefined) {
        if (steps === goal) {
          layout[position] = { type: PieceType.Queen, color: PieceColor.White };
          break;
        }
        steps++;
      }
    }
  }

  for (let i = 0; i < BOARD_SIDE; i++) {
    if (layout[i] === undefined) {
      layout[i] = {type: PieceType.Rook, color: PieceColor.White }
    }
  }

  Terminal.log(
    layout[0] + '\n' +
    layout[1] + '\n' +
    layout[2] + '\n' +
    layout[3] + '\n' +
    layout[4] + '\n' +
    layout[5] + '\n' +
    layout[6] + '\n' +
    layout[7]
  );

  for (let i = 0; i < BOARD_SIDE; i++) {
    layout[BOARD_SIDE * (BOARD_SIDE - 1) + i] = { type: layout[i]!.type, color: PieceColor.Black };
  }

  return layout;
}

export function emitToUser<Ev extends EventNames<ServerToClientEvents>>(
  webSocketServer: WebSocketServer,
  user: User,
  ev: Ev,
  ...args: EventParams<ServerToClientEvents, Ev>
) {
  //create key-value pairs of key and socketId
  //when user auto signs in,
  //find the key and assign the new SocketId as its value
  //when sending here, send to all the values
  user.socketsIds.forEach((socketId) => {
    Terminal.log(`Emmiting ${ev} to {${socketId.key}, ${socketId.value}`);
    webSocketServer.to(socketId.value).emit(ev, ...args);
  });
}

export function toValidId(id: ObjectId) {
  return new ObjectId(id.toString());
}