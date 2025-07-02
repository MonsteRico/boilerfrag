"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { bracketEntries, brackets, bracketsRelations, usersToBracketEntries } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function registerUser(bracketId: string, entryCode?: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const bracket = await db.query.brackets.findFirst({
    where: eq(brackets.id, bracketId),
    with: { bracketEntries: { with: { users: true } } },
  });
  if (!bracket) throw new Error("Bracket not found"); 
  if (bracket.bracketEntries.map((entry) => entry.users.map((user) => user.userId)).flat().includes(session.user.id)) {
    throw new Error("Already registered");
  }
  const numberPlayers = bracket.bracketEntries.length;
  if (numberPlayers >= bracket.maxPlayerCount) {
    throw new Error("Max player count reached");
  }
  const newEntryCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const [bracketEntry] = await db.insert(bracketEntries).values({
    bracketId,
    entryCode: entryCode ?? newEntryCode,
  }).returning();
  if (!bracketEntry) throw new Error("Failed to create bracket entry");

  await db.insert(usersToBracketEntries).values({
    userId: session.user.id,
    bracketEntryId: bracketEntry.id,
  });

  if (bracket.maxPlayerCount === numberPlayers) {
    await db.update(brackets).set({
      stage: "EDIT_TEAMS",
    }).where(eq(brackets.id, bracketId));
  }

  revalidatePath(`/brackets`);
}
