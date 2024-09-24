import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `boilerfrag_${name}`);

export const games = createTable("game", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("name", { length: 256 }).notNull(),
  shortName: varchar("short_name", { length: 256 }).notNull(),
  coverArt: varchar("cover_art", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  minimumPlayersPerTeam: integer("minimum_players_per_team").notNull(),
});

export type Game = typeof games.$inferSelect;

export const teams = createTable(
  "team",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 256 }).notNull(),
    captainId: varchar("captain_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id),
    joinId: uuid("join_id").defaultRandom().notNull(),
    bracketId: uuid("bracket_id").references(() => brackets.id),
  },
  (example) => ({
    captainIdIdx: index("created_by_idx").on(example.captainId),
    nameIndex: index("name_idx").on(example.name),
    gameIndex: index("game_idx").on(example.gameId),
  }),
);

export type CreateTeam = typeof teams.$inferInsert;

export const teamsRelations = relations(teams, ({ many, one }) => ({
  users: many(teamsToUsers),
  captain: one(users, { fields: [teams.captainId], references: [users.id] }),
  game: one(games, { fields: [teams.gameId], references: [games.id] }),
  bracket: one(brackets, {
    fields: [teams.bracketId],
    references: [brackets.id],
  }),
}));

export const usersToBrackets = createTable("users_to_brackets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  bracketId: uuid("bracket_id")
    .notNull()
    .references(() => brackets.id),
});

export const usersToBracketsRelations = relations(usersToBrackets, ({ one }) => ({
  user: one(users, { fields: [usersToBrackets.userId], references: [users.id] }),
  bracket: one(brackets, { fields: [usersToBrackets.bracketId], references: [brackets.id] }),
}));

export const bracketStagesEnum = pgEnum("bracket_stage", ["REGISTRATION", "MAKING_TEAMS", "EDIT_TEAMS", "SET_SEEDS", "RUNNING", "FINISHED"]);

export const brackets = createTable("bracket", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id"),
  name: text("name").notNull(),
  stage: bracketStagesEnum("stage").notNull().default("REGISTRATION"),
  format: text("format").notNull(), // e.g., "single_elimination", "double_elimination"
  individualAndGroupSignup: boolean("individual_and_group_signup").notNull(), // whether the bracket is individual/group signup vs team signup
  maxTeamSize: integer("max_team_size").notNull(), // Maximum number of players per team (0 for no limit)
  maxGroupSize: integer("max_group_size").notNull(), // Maximum number of players per group (0 for no limit)
  maxPlayerCount: integer("max_player_count").notNull(), // Maximum number of players in the bracket
  maxTeamCount: integer("max_team_count").notNull(), // Maximum number of teams in the bracket
  rounds: integer("rounds"), // Total number of rounds in the bracket
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
});

export type Bracket = typeof brackets.$inferSelect;
export type CreateBracket = typeof brackets.$inferInsert;

export const bracketsRelations = relations(brackets, ({ one, many }) => ({
  game: one(games, { fields: [brackets.gameId], references: [games.id] }),
  teams: many(teams),
  users: many(usersToBrackets),
}));

export const matchStatesEnum = pgEnum("match_state", [
  "DONE",
  "SCORE_DONE",
  "WALK_OVER",
  "NO_SHOW",
  "NO_PARTY",
]);

export const matches = createTable("match", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }),
  nextMatchId: uuid("next_match_id"),
  nextLooserMatchId: uuid("next_looser_match_id"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  state: matchStatesEnum("state"),
  participants: jsonb("participants")
    .$type<{
      id: string; // team id
      resultText: string; // e.g., "1" or "Won" this is the score text
      isWinner: boolean;
      status: "PLAYED" | "NO_SHOW" | "WALK_OVER" | "NO_PARTY" | null;
      name: string; // team name
    }>()
    .array(),
});

export type Match = typeof matches.$inferSelect;
export type CreateMatch = typeof matches.$inferInsert;

export const roleEnum = pgEnum("role", ["player", "admin", "super_admin"]);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
  role: roleEnum("role").default("player"),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  teamsToUsers: many(teamsToUsers),
  bracketsToUsers: many(usersToBrackets),
}));

export const teamsToUsers = createTable("teams_to_users", {
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
});

export const teamsToUsersRelations = relations(teamsToUsers, ({ one }) => ({
  team: one(teams, { fields: [teamsToUsers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamsToUsers.userId], references: [users.id] }),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
