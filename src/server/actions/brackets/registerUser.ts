"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { brackets, bracketsRelations, usersToBrackets } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function registerUser(bracketId: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const bracket = await db.query.brackets.findFirst({
    where: eq(brackets.id, bracketId),
    with: { users: true, teams: { with: { users: true } } },
  });
  if (!bracket) throw new Error("Bracket not found");
  if (!bracket.individualAndGroupSignup) {
    throw new Error("Individual/Group signup not allowed");
  }
  if (bracket.users.map((user) => user.userId).includes(session.user.id)) {
    throw new Error("Already registered");
  }
  const numberPlayers = bracket.users.length;
  if (numberPlayers >= bracket.maxPlayerCount) {
    throw new Error("Max player count reached");
  }
  await db.insert(usersToBrackets).values({
    userId: session.user.id,
    bracketId,
  });

  revalidatePath(`/brackets`);
}
