"use server";

import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { teams, teamsToUsers } from "../../db/schema";

export async function createTeam(name: string, gameId: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const captainId = session.user.id;
  const [inserted] = await db
    .insert(teams)
    .values({
      name,
      gameId,
      captainId,
    })
    .returning();
  // add captain to team

  if (!inserted) throw new Error("Failed to create team");
  await db.insert(teamsToUsers).values({
    teamId: inserted.id,
    userId: captainId,
  });
  return inserted;
}
