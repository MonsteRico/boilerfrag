"use server";

import { and, eq } from "drizzle-orm";
import { getServerAuthSession } from "../auth";
import { db } from "../db";
import { teams, teamsToUsers } from "../db/schema";

export async function leaveTeam(teamId: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new Error("Team not found");

  await db.delete(teamsToUsers).where(and(eq(teamsToUsers.teamId, teamId), eq(teamsToUsers.userId, session.user.id)));
}
