import { PieceData, PieceType } from "shared/types/piece";

export type PieceDataWithKey = PieceData & { key: string };

export type BoardLayout = (PieceDataWithKey | null)[]

export type PieceCount = {type: PieceType, count: number};