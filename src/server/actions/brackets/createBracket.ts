"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import {
  brackets,
  bracketsRelations,
  CreateBracket,
  games,
  users,
} from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function createBracket({
  name,
  gameId,
  format,
  maxTeamSize,
  maxTeamCount,
  maxPlayerCount,
  maxGroupSize,
}: CreateBracket) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser) throw new Error("Not logged in");
  if (dbUser.role !== "admin" && dbUser.role !== "super_admin") {
    throw new Error("Not admin");
  }
  if (!gameId) throw new Error("No gameId provided");
  const game = await db.query.games.findFirst({ where: eq(games.id, gameId) });
  if (!game) throw new Error("Game not found");

  const [bracket] = await db
    .insert(brackets)
    .values({
      name,
      gameId,
      format,
      maxTeamSize,
      maxTeamCount,
      maxPlayerCount,
      rounds: Math.floor(Math.log2(maxTeamCount)) + 1,
      maxGroupSize,
    })
    .returning();
  if (!bracket) throw new Error("Failed to create bracket");
  revalidatePath(`/brackets`);
  return bracket;
}
