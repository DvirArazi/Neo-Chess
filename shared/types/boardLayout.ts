import { PieceData } from "shared/types/piece";

export type BoardLayout = (PieceData & { key: number } | undefined)[]