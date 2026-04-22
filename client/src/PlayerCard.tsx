import type { PieceColor, PieceType } from "./chess/types";
import blackPawn from "./assets/images/pieces/black-pawn.svg";
import blackKnight from "./assets/images/pieces/black-knight.svg";
import blackBishop from "./assets/images/pieces/black-bishop.svg";
import blackRook from "./assets/images/pieces/black-rook.svg";
import blackQueen from "./assets/images/pieces/black-queen.svg";
import whitePawn from "./assets/images/pieces/white-pawn.svg";
import whiteKnight from "./assets/images/pieces/white-knight.svg";
import whiteBishop from "./assets/images/pieces/white-bishop.svg";
import whiteRook from "./assets/images/pieces/white-rook.svg";
import whiteQueen from "./assets/images/pieces/white-queen.svg";

export type CapturePieceType = Exclude<PieceType, "king">;

export type CapturedPieceStack = {
  type: CapturePieceType;
  count: number;
};

export type CapturedMaterial = {
  pieces: CapturedPieceStack[];
  materialLead: number;
};

export type PlayerCardProps = {
  color: PieceColor;
  name: string;
  clock: string;
  imageSrc: string;
  capturedMaterial: CapturedMaterial;
  isActive: boolean;
};

const CAPTURE_ICON_SOURCES: Record<
  PieceColor,
  Record<CapturePieceType, string>
> = {
  black: {
    bishop: blackBishop,
    knight: blackKnight,
    pawn: blackPawn,
    queen: blackQueen,
    rook: blackRook,
  },
  white: {
    bishop: whiteBishop,
    knight: whiteKnight,
    pawn: whitePawn,
    queen: whiteQueen,
    rook: whiteRook,
  },
};

export function PlayerCard(props: PlayerCardProps) {
  const capturedPieceColor = props.color === "white" ? "black" : "white";

  return (
    <section
      className={[
        "player-card",
        `player-card--${props.color}`,
        props.isActive ? "player-card--active" : "",
      ].filter(Boolean).join(" ")}
    >
      <img
        className="player-card__avatar"
        src={props.imageSrc}
        alt={`${props.name} player`}
      />

      <div className="player-card__identity">
        <div className="player-card__name-row">
          <span className="player-card__name">{props.name}</span>
        </div>

        <div
          className="player-card__captures"
          aria-label={`${props.name} captured material`}
        >
          {props.capturedMaterial.pieces.length > 0
            ? props.capturedMaterial.pieces.map(({ type, count }) => (
              <span
                key={type}
                className="player-card__capture-stack"
                aria-label={`${count} captured ${type}${count > 1 ? "s" : ""}`}
              >
                {Array.from({ length: count }, (_, index) => (
                  <img
                    key={`${type}-${index}`}
                    className="player-card__capture-piece"
                    src={CAPTURE_ICON_SOURCES[capturedPieceColor][type]}
                    alt=""
                  />
                ))}
              </span>
            ))
            : <span className="player-card__captures-placeholder" />}

          {props.capturedMaterial.materialLead > 0
            ? (
              <span className="player-card__material-lead">
                +{props.capturedMaterial.materialLead}
              </span>
            )
            : null}
        </div>
      </div>

      <div className="player-card__clock" aria-label={`${props.name} clock`}>
        {props.clock}
      </div>
    </section>
  );
}
