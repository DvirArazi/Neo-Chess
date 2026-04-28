import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  usernameNormalized: text("username_normalized").notNull().unique(),
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

export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostUserId: uuid("host_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  state: text("state").notNull(),
  isFinished: boolean("is_finished").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
