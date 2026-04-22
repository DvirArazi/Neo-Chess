import { useState } from "react";
import { createInitialBoard } from "./chess/setup";
import type { MoveInput } from "./chess/types";
import { applyMove } from "../../shared/chess/moveGeneration";
import { Game } from "./Game";
import whiteProfileImage from "./assets/images/localProfile/white.png";
import blackProfileImage from "./assets/images/localProfile/black.png";

function LocalGame() {
  const [gameState, setGameState] = useState(createInitialBoard);

  const handleMoveAttempt = (move: MoveInput) => {
    setGameState((prevGameState) => applyMove(prevGameState, move));
  };

  return (
    <Game
      gameState={gameState}
      onMoveAttempt={handleMoveAttempt}
      players={{
        black: {
          name: "Black",
          clock: "10:00",
          imageSrc: blackProfileImage,
        },
        white: {
          name: "White",
          clock: "10:00",
          imageSrc: whiteProfileImage,
        },
      }}
    />
  );
}

export default LocalGame;
