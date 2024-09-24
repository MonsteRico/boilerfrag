"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { teams } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function updateTeamName(teamId: string, name: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new Error("Team not found");
  if (team.captainId !== session.user.id) {
    throw new Error("Not captain");
  }
  await db.update(teams).set({ name }).where(eq(teams.id, teamId));
  revalidatePath(`/teams/${teamId}`);
}
