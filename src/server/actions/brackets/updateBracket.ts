"use server";

import { eq } from "drizzle-orm";
import { getServerAuthSession } from "../../auth";
import { db } from "../../db";
import { brackets, users } from "../../db/schema";
import { revalidatePath } from "next/cache";

export async function updateBracket({
  id,
  name,
  gameId,
  format,
  maxTeamSize,
  maxTeamCount,
  maxPlayerCount,
  maxGroupSize,
  stage,
}: {
  id: string;
  name?: string;
  gameId?: string;
  format?: string;
  maxTeamSize?: number;
  maxTeamCount?: number;
  maxPlayerCount?: number;
  maxGroupSize?: number;
  stage?:
    | "REGISTRATION"
    | "MAKING_TEAMS"
    | "EDIT_TEAMS"
    | "SET_SEEDS"
    | "RUNNING"
    | "FINISHED";
}) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser) throw new Error("Not logged in");
  if (dbUser.role !== "admin" && dbUser.role !== "super_admin") {
    throw new Error("Not admin");
  }
  if (!id) throw new Error("No bracket id provided");

  const updateFields: any = {};
  if (name !== undefined) updateFields.name = name;
  if (gameId !== undefined) updateFields.gameId = gameId;
  if (format !== undefined) updateFields.format = format;
  if (maxTeamSize !== undefined) updateFields.maxTeamSize = maxTeamSize;
  if (maxTeamCount !== undefined) updateFields.maxTeamCount = maxTeamCount;
  if (maxPlayerCount !== undefined)
    updateFields.maxPlayerCount = maxPlayerCount;
  if (maxGroupSize !== undefined) updateFields.maxGroupSize = maxGroupSize;
  if (stage !== undefined) updateFields.stage = stage;

  const [updated] = await db
    .update(brackets)
    .set(updateFields)
    .where(eq(brackets.id, id))
    .returning();
  if (!updated) throw new Error("Failed to update bracket");
  revalidatePath(`/brackets`);
  return updated;
}
