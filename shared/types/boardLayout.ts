import { PieceData, PieceType } from "shared/types/piece";

export type PieceDataWithKey = PieceData & { key: string };

export type BoardLayout = (PieceDataWithKey | undefined)[]

export type PieceCount = {type: PieceType, count: number};