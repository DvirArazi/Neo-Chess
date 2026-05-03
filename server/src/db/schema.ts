import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { OnlineGameState } from "../../../shared/socket.js";
import type { GameState } from "../../../shared/chess/types.js";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  usernameNormalized: text("username_normalized").notNull().unique(),
  elo: integer("elo").default(1200).notNull(),
  passwordHash: text("password_hash"),
  googleSubject: text("google_subject").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

export const friendRequests = pgTable("friend_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isSeen: boolean("is_seen").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("friend_requests_requester_recipient_unique").on(
    table.requesterId,
    table.recipientId,
  ),
]);

export const friendships = pgTable("friendships", {
  id: uuid("id").defaultRandom().primaryKey(),
  userAId: uuid("user_a_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userBId: uuid("user_b_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("friendships_user_a_user_b_unique").on(
    table.userAId,
    table.userBId,
  ),
]);

export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostUserId: uuid("host_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  state: text("state").notNull(),
  isFinished: boolean("is_finished").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const onlineGameRecords = pgTable("online_games", {
  id: uuid("id").primaryKey(),
  whiteUserId: uuid("white_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blackUserId: uuid("black_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  timeControlId: text("time_control_id").notNull(),
  state: jsonb("state").$type<GameState>().notNull(),
  snapshot: jsonb("snapshot").$type<OnlineGameState>().notNull(),
  isFinished: boolean("is_finished").default(false).notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (table) => [
  index("online_games_white_user_id_idx").on(table.whiteUserId),
  index("online_games_black_user_id_idx").on(table.blackUserId),
  index("online_games_updated_at_idx").on(table.updatedAt),
]);
