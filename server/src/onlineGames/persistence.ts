import { eq, or } from "drizzle-orm";
import type { OnlineGameState } from "../../../shared/socket.js";
import { db } from "../db/index.js";
import { onlineGameRecords } from "../db/schema.js";

function isOnlineGameState(value: unknown): value is OnlineGameState {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<OnlineGameState>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.mode === "string" &&
    typeof candidate.timeControlId === "string" &&
    typeof candidate.players === "object" &&
    candidate.players !== null &&
    typeof candidate.state === "object" &&
    candidate.state !== null &&
    Array.isArray(candidate.history) &&
    Array.isArray(candidate.moves) &&
    typeof candidate.status === "object" &&
    candidate.status !== null &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
}

function toDate(ms: number): Date {
  return new Date(ms);
}

export async function loadPersistedOnlineGames(): Promise<OnlineGameState[]> {
  const rows = await db
    .select({ snapshot: onlineGameRecords.snapshot })
    .from(onlineGameRecords);

  return rows
    .map((row) => row.snapshot)
    .filter(isOnlineGameState);
}

export async function loadPersistedOnlineGamesForUser(
  userId: string,
): Promise<OnlineGameState[]> {
  const rows = await db
    .select({ snapshot: onlineGameRecords.snapshot })
    .from(onlineGameRecords)
    .where(
      or(
        eq(onlineGameRecords.whiteUserId, userId),
        eq(onlineGameRecords.blackUserId, userId),
      ),
    );

  return rows
    .map((row) => row.snapshot)
    .filter(isOnlineGameState)
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function persistOnlineGameSnapshot(
  game: OnlineGameState,
): Promise<void> {
  const record = {
    id: game.id,
    whiteUserId: game.players.white.id,
    blackUserId: game.players.black.id,
    mode: game.mode,
    timeControlId: game.timeControlId,
    state: game.state,
    snapshot: game,
    isFinished: game.status.type !== "active",
    createdAt: toDate(game.createdAt),
    updatedAt: toDate(game.updatedAt),
  };

  await db
    .insert(onlineGameRecords)
    .values(record)
    .onConflictDoUpdate({
      target: onlineGameRecords.id,
      set: {
        whiteUserId: record.whiteUserId,
        blackUserId: record.blackUserId,
        mode: record.mode,
        timeControlId: record.timeControlId,
        state: record.state,
        snapshot: record.snapshot,
        isFinished: record.isFinished,
        updatedAt: record.updatedAt,
      },
    });
}
