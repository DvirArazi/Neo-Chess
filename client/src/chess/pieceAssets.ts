import type { PieceColor, PieceType } from "./types";
import blackBishop from "../assets/images/pieces/black-bishop.svg";
import blackKing from "../assets/images/pieces/black-king.svg";
import blackKnight from "../assets/images/pieces/black-knight.svg";
import blackPawn from "../assets/images/pieces/black-pawn.svg";
import blackQueen from "../assets/images/pieces/black-queen.svg";
import blackRook from "../assets/images/pieces/black-rook.svg";
import whiteBishop from "../assets/images/pieces/white-bishop.svg";
import whiteKing from "../assets/images/pieces/white-king.svg";
import whiteKnight from "../assets/images/pieces/white-knight.svg";
import whitePawn from "../assets/images/pieces/white-pawn.svg";
import whiteQueen from "../assets/images/pieces/white-queen.svg";
import whiteRook from "../assets/images/pieces/white-rook.svg";

export type PieceImage = HTMLImageElement;
export type PieceImages = Record<PieceColor, Record<PieceType, PieceImage>>;

const pieceImageSources: Record<PieceColor, Record<PieceType, string>> = {
  black: {
    bishop: blackBishop,
    king: blackKing,
    knight: blackKnight,
    pawn: blackPawn,
    queen: blackQueen,
    rook: blackRook,
  },
  white: {
    bishop: whiteBishop,
    king: whiteKing,
    knight: whiteKnight,
    pawn: whitePawn,
    queen: whiteQueen,
    rook: whiteRook,
  },
};

let pieceImages: PieceImages | null = null;
let preloadPromise: Promise<PieceImages> | null = null;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error(`Failed to load piece image: ${src}`)), {
      once: true,
    });
    image.src = src;
  });
}

export function preloadPieceImages(): Promise<PieceImages> {
  if (pieceImages) return Promise.resolve(pieceImages);
  if (preloadPromise) return preloadPromise;

  preloadPromise = Promise.all(
    (Object.keys(pieceImageSources) as PieceColor[]).flatMap((color) =>
      (Object.keys(pieceImageSources[color]) as PieceType[]).map(async (type) => {
        const image = await loadImageElement(pieceImageSources[color][type]);
        return { color, type, image };
      }),
    ),
  )
    .then((entries) => {
      const loadedImages: PieceImages = {
        black: {} as Record<PieceType, PieceImage>,
        white: {} as Record<PieceType, PieceImage>,
      };

      for (const { color, type, image } of entries) {
        loadedImages[color][type] = image;
      }

      pieceImages = loadedImages;
      return loadedImages;
    })

  return preloadPromise;
}

export function getPieceImages(): PieceImages {
  return pieceImages!;
}
