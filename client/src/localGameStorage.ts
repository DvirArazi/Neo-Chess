import type { GameState, MoveInput, PieceColor } from "./chess/types";

export type LocalGameClockSnapshot = Record<PieceColor, number>;

export type LocalGameStatus =
  | { type: "active" }
  | { type: "draw"; reason: "stalemate" }
  | { type: "checkmate"; winner: PieceColor; loser: PieceColor }
  | { type: "timeout"; winner: PieceColor; loser: PieceColor };

export type LocalGameRecord = {
  id: string;
  userId: string;
  timeControlId: string;
  state: GameState;
  history: GameState[];
  moves: MoveInput[];
  clockHistory: LocalGameClockSnapshot[];
  clockSnapshot: LocalGameClockSnapshot;
  bottomPlayerColor: PieceColor;
  hasPieRuleBeenUsed: boolean;
  status: LocalGameStatus;
  createdAt: number;
  updatedAt: number;
};

const LOCAL_GAMES_STORAGE_KEY = "neo-chess-local-games";
const MAX_STORED_LOCAL_GAMES_PER_USER = 100;

type StoredLocalGamesByUser = Record<string, LocalGameRecord[]>;

function isLocalGameRecord(value: unknown): value is LocalGameRecord {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<LocalGameRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.userId === "string" &&
    typeof candidate.timeControlId === "string" &&
    typeof candidate.state === "object" &&
    candidate.state !== null &&
    Array.isArray(candidate.history) &&
    Array.isArray(candidate.moves) &&
    Array.isArray(candidate.clockHistory) &&
    typeof candidate.clockSnapshot === "object" &&
    candidate.clockSnapshot !== null &&
    (candidate.bottomPlayerColor === "white" ||
      candidate.bottomPlayerColor === "black") &&
    typeof candidate.hasPieRuleBeenUsed === "boolean" &&
    typeof candidate.status === "object" &&
    candidate.status !== null &&
    typeof candidate.createdAt === "number" &&
    typeof candidate.updatedAt === "number"
  );
}

function readStoredLocalGamesByUser(): StoredLocalGamesByUser {
  const storedValue = window.localStorage.getItem(LOCAL_GAMES_STORAGE_KEY);
  if (!storedValue) return {};

  try {
    const parsedValue = JSON.parse(storedValue) as unknown;
    if (typeof parsedValue !== "object" || parsedValue === null) return {};

    const recordsByUser: StoredLocalGamesByUser = {};
    for (const [userId, records] of Object.entries(parsedValue)) {
      if (!Array.isArray(records)) continue;
      recordsByUser[userId] = records
        .filter(isLocalGameRecord)
        .sort((left, right) => right.updatedAt - left.updatedAt);
    }

    return recordsByUser;
  } catch {
    window.localStorage.removeItem(LOCAL_GAMES_STORAGE_KEY);
    return {};
  }
}

function writeStoredLocalGamesByUser(recordsByUser: StoredLocalGamesByUser): void {
  window.localStorage.setItem(
    LOCAL_GAMES_STORAGE_KEY,
    JSON.stringify(recordsByUser),
  );
}

export function getStoredLocalGamesForUser(userId: string): LocalGameRecord[] {
  return readStoredLocalGamesByUser()[userId] ?? [];
}

export function upsertStoredLocalGame(record: LocalGameRecord): LocalGameRecord[] {
  const recordsByUser = readStoredLocalGamesByUser();
  const currentRecords = recordsByUser[record.userId] ?? [];
  const nextRecords = [
    record,
    ...currentRecords.filter((currentRecord) => currentRecord.id !== record.id),
  ]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_STORED_LOCAL_GAMES_PER_USER);

  recordsByUser[record.userId] = nextRecords;
  writeStoredLocalGamesByUser(recordsByUser);
  return nextRecords;
}
