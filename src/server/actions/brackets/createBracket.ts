"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { brackets, bracketsRelations, CreateBracket, games, users } from "../../db/schema";

export async function createBracket({ name, gameId, format, individualAndGroup, maxTeamSize, maxTeamCount }: { name: string, gameId: string, format: string, individualAndGroup: boolean, maxTeamSize: number, maxTeamCount: number }) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const dbUser = await db.query.users.findFirst({where:eq(users.id, session.user.id)});
  if (!dbUser) throw new Error("Not logged in");
  if (dbUser.role !== "admin" && dbUser.role !== "super_admin") {
    throw new Error("Not admin");
  }
  const game = await db.query.games.findFirst({where:eq(games.id, gameId)});
  if (!game) throw new Error("Game not found");
  const maxPlayerCount = individualAndGroup ? maxTeamCount * game.minimumPlayersPerTeam : maxTeamSize * maxTeamCount;
  const [inserted] = await db
    .insert(brackets)
    .values({
      name,
      gameId: gameId,
      format,
      individualAndGroupSignup: individualAndGroup,
      maxTeamSize,
      maxTeamCount,
      maxGroupSize: maxTeamSize,
      maxPlayerCount
    })
    .returning();

}