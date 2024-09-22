"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../auth";
import { db } from "../db";
import { teams, teamsToUsers, users } from "../db/schema";

export async function getTeam(teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new Error("Team not found");
  const captainId = team.captainId
  const teamMembersRows = await db
    .select()
    .from(teamsToUsers)
    .innerJoin(users, eq(teamsToUsers.userId, users.id))
    .where(eq(teamsToUsers.teamId, teamId));
  const teamMembers = teamMembersRows.map((row) => row.user);
  return {
    ...team,
    captain: teamMembers.find((user) => user.id === captainId)!,
    users: teamMembers.filter((user) => user.id !== captainId),
  };
}
