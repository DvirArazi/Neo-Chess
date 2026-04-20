import { useState } from "react";
import { createInitialBoard } from "./chess/setup";
import { Board } from "./chess/Board";
import { applyMove } from "../../shared/chess/moveGeneration";
import type { MoveInput } from "./types";

function LocalGame() {
  const [boardState, setBoardState] = useState(createInitialBoard);

  const handleMoveAttempt = (move: MoveInput) => {
    setBoardState((prevBoardState) => applyMove(prevBoardState, move));
  };

  return (
    <Board
      boardState={boardState}
      onMoveAttempt={handleMoveAttempt}
    />
  );
}

export default LocalGame;
