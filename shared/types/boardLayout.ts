import { PieceData, PieceType } from "shared/types/piece";

export type PieceDataWithKey = PieceData & { key: number };

export type BoardLayout = (PieceDataWithKey | null)[]

export type PieceCount = {type: PieceType, count: number};