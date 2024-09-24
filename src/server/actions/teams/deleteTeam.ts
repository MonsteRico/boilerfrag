"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { teams, teamsToUsers } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function deleteTeam(teamId: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new Error("Team not found");
  if (team.captainId !== session.user.id) {
    throw new Error("Not captain");
  }
  const users = await db
    .select({ userId: teamsToUsers.userId })
    .from(teamsToUsers)
    .where(eq(teamsToUsers.teamId, teamId));
  if (users.length > 1) {
    throw new Error("Cannot delete team with members");
  }
  await db.delete(teamsToUsers).where(eq(teamsToUsers.teamId, teamId));
  await db.delete(teams).where(eq(teams.id, teamId));
  
  revalidatePath(`/teams`);
}
