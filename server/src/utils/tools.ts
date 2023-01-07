import { BOARD_SIDE } from "shared/globals";
import { PieceColor, PieceData, PieceType } from "shared/pieceData";
import { EventNames, EventParams, EventsMap } from "socket.io/dist/typed-events";
import { User } from "./types";

export function generateBoardLayout() {
  const layout = Array<PieceData | undefined>(BOARD_SIDE*BOARD_SIDE).fill(undefined);

  layout[Math.floor(Math.random()*4)*2] = {type: PieceType.Bishop, color: PieceColor.White};
  layout[Math.floor(Math.random()*4)*2 + 1] = {type: PieceType.Bishop, color: PieceColor.White};

  const pieceTypes = [
    PieceType.King,
    PieceType.Queen,
    PieceType.Knight,
    PieceType.Knight,
  ];

  for (let pieceI = 0; pieceI < pieceTypes.length; pieceI++) {
    let goal = Math.floor(Math.random()*(6-pieceI));
    let steps = 0;
    for (let position = 0; position < BOARD_SIDE; position++) {
      if (layout[position] === undefined) {
        if (steps === goal) {
          layout[position] = {type: PieceType.Queen, color: PieceColor.White};
          break;
        }
        steps++;
      }
    }
  }

  for (let i = 0; i < BOARD_SIDE; i++) {
    layout[BOARD_SIDE*(BOARD_SIDE-1)+i] = {type: layout[i]!.type, color: PieceColor.Black}; 
  }

  return layout;
}


// export function emitTo<EmitEvents extends EventsMap, Ev extends EventNames<EmitEvents>>(user: User, ev: Ev, ...args: EventParams<EmitEvents, Ev>) {
//   user.socketsIds.forEach((id)=>{
    
//   });
// }