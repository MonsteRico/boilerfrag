"use server";

import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { brackets, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteBracket(id: string) {
  const session = await getServerAuthSession();
  if (!session) throw new Error("Not logged in");
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!dbUser) throw new Error("Not logged in");
  if (dbUser.role !== "admin" && dbUser.role !== "super_admin") {
    throw new Error("Not admin");
  }
  await db.delete(brackets).where(eq(brackets.id, id));
  revalidatePath("/");
}