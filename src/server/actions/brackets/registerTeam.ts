"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import {
  brackets,
  bracketsRelations,
  teams,
  usersToBrackets,
} from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function registerTeam(bracketId: string, teamId: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const bracket = await db.query.brackets.findFirst({
    where: eq(brackets.id, bracketId),
    with: { teams: { with: { users: true } }, users: true },
  });
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: { users: true },
  });
  if (!team) throw new Error("Team not found");
  if (!bracket) throw new Error("Bracket not found");

  // check if team is already registered
  if (bracket.teams.map((team) => team.id).includes(teamId)) {
    throw new Error("Team already registered");
  }
  // check if bracket is not individual and is at max teams
  if (
    !bracket.individualAndGroupSignup &&
    bracket.teams.length >= bracket.maxTeamCount
  ) {
    throw new Error("Max teams are signed up");
  }
  // check if bracket is individual/group and adding teams users goes over max players
  const numberPlayers = bracket.users.length;
  if (
    bracket.individualAndGroupSignup &&
    numberPlayers + team.users.length >= bracket.maxPlayerCount
  ) {
    throw new Error("Too many players to add team");
  }
  // check if any team users are already registered
  if (team.users.map((user) => user.userId).some((userId) => bracket.users.map((bracketUser) => bracketUser.userId).includes(userId))) {
    throw new Error("Team or a team member is already registered");
  }
  // check if team is over max group size
  if (team.users.length > bracket.maxGroupSize) {
    throw new Error("Team is over max group size");
  }

  await db.update(teams).set({ bracketId }).where(eq(teams.id, teamId));

  for (const user of team.users) {
    await db.insert(usersToBrackets).values({
      userId: user.userId,
      bracketId,
    });
  }

  revalidatePath(`/brackets`);
}
