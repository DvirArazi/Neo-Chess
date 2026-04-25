import type { ReactNode } from "react";
import { Board } from "./chess/Board";
import type { GameState, MoveInput, PieceColor, PieceType } from "./chess/types";
import {
  PlayerCard,
  type CapturedMaterial,
  type CapturedPieceStack,
  type CapturePieceType,
} from "./PlayerCard";

type PlayerInfo = {
  name: string;
  clock: string;
  imageSrc: string;
};

type GameProps = {
  gameState: GameState;
  prevMove: MoveInput | null;
  transitionMove: MoveInput | null;
  shouldAnimateReset: boolean;
  onMoveAttempt: (move: MoveInput) => void;
  players: Record<PieceColor, PlayerInfo>;
  controls?: ReactNode;
};

const STARTING_PIECE_COUNTS: Record<PieceType, number> = {
  bishop: 2,
  king: 1,
  knight: 2,
  pawn: 8,
  queen: 1,
  rook: 2,
};

const MATERIAL_VALUES: Record<CapturePieceType, number> = {
  bishop: 3,
  knight: 3,
  pawn: 1,
  queen: 9,
  rook: 5,
};

const CAPTURE_DISPLAY_ORDER: CapturePieceType[] = [
  "queen",
  "rook",
  "bishop",
  "knight",
  "pawn",
];

function getCapturedMaterial(
  gameState: GameState,
): Record<PieceColor, CapturedMaterial> {
  const currentPieceCounts: Record<PieceColor, Record<PieceType, number>> = {
    black: { ...STARTING_PIECE_COUNTS },
    white: { ...STARTING_PIECE_COUNTS },
  };

  for (const color of ["black", "white"] as PieceColor[]) {
    for (const type of Object.keys(currentPieceCounts[color]) as PieceType[]) {
      currentPieceCounts[color][type] = 0;
    }
  }

  for (const row of gameState.board) {
    for (const piece of row) {
      if (!piece) continue;
      currentPieceCounts[piece.color][piece.type] += 1;
    }
  }

  function buildCapturedMaterial(color: PieceColor): CapturedMaterial {
    const opponentColor = color === "white" ? "black" : "white";
    const pieces: CapturedPieceStack[] = [];
    let materialScore = 0;

    for (const type of CAPTURE_DISPLAY_ORDER) {
      const capturedCount = STARTING_PIECE_COUNTS[type] -
        currentPieceCounts[opponentColor][type];

      if (capturedCount > 0) {
        pieces.push({ type, count: capturedCount });
        materialScore += MATERIAL_VALUES[type] * capturedCount;
      }
    }

    return { pieces, materialLead: materialScore };
  }

  const whiteCapturedMaterial = buildCapturedMaterial("white");
  const blackCapturedMaterial = buildCapturedMaterial("black");

  return {
    white: {
      pieces: whiteCapturedMaterial.pieces,
      materialLead: Math.max(
        0,
        whiteCapturedMaterial.materialLead - blackCapturedMaterial.materialLead,
      ),
    },
    black: {
      pieces: blackCapturedMaterial.pieces,
      materialLead: Math.max(
        0,
        blackCapturedMaterial.materialLead - whiteCapturedMaterial.materialLead,
      ),
    },
  };
}

export function Game(props: GameProps) {
  const capturedMaterial = getCapturedMaterial(props.gameState);

  return (
    <main className="local-game">
      <div className="local-game__mobile-shell">
        <PlayerCard
          color="black"
          name={props.players.black.name}
          clock={props.players.black.clock}
          imageSrc={props.players.black.imageSrc}
          capturedMaterial={capturedMaterial.black}
          isActive={props.gameState.turn === "black"}
        />

        <div className="local-game__board-shell">
          <Board
            gameState={props.gameState}
            prevMove={props.prevMove}
            transitionMove={props.transitionMove}
            shouldAnimateReset={props.shouldAnimateReset}
            onMoveAttempt={props.onMoveAttempt}
          />
        </div>

        <PlayerCard
          color="white"
          name={props.players.white.name}
          clock={props.players.white.clock}
          imageSrc={props.players.white.imageSrc}
          capturedMaterial={capturedMaterial.white}
          isActive={props.gameState.turn === "white"}
        />

        {props.controls}
      </div>
    </main>
  );
}
