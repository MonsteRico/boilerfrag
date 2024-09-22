import { Button } from "@/components/ui/button";
import { getTeam } from "@/server/actions/getTeam";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamsToUsers, users } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { use } from "react";
import toast from "react-hot-toast";

export default async function IndividualTeamsPage({
  params,
}: {
  params: { joinId: string };
}) {
  const { joinId } = params;

  const session = await getServerAuthSession();

  if (!session) {
    return <div>Please log in</div>;
  }

  const [teamId] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.joinId, joinId));
  if (!teamId) {
    return <div>Invalid join link</div>;
  }

  const team = await getTeam(teamId.id);

  if (!team) {
    redirect(`/teams`);
  }
  if (
    team.captainId !== session.user.id &&
    !team.users.map((user) => user.id).includes(session.user.id)
  ) {
    await db.insert(teamsToUsers).values({
      teamId: team.id,
      userId: session.user.id,
    });
  }

  redirect(`/teams/${team.id}`);
}
