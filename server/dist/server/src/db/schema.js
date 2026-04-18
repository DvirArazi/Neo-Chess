import { pgTable, uuid, text, timestamp, boolean, } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const games = pgTable("games", {
    id: uuid("id").defaultRandom().primaryKey(),
    hostUserId: uuid("host_user_id").notNull(),
    state: text("state").notNull(),
    isFinished: boolean("is_finished").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
