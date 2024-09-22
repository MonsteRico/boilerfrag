import { Button } from "@/components/ui/button";
import { getTeam } from "@/server/actions/getTeam";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamsToUsers, users } from "@/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import toast from "react-hot-toast";
import EditTeamName from "./(components)/edit-team-name";
import AddMembers from "./(components)/add-members";
import { Delete } from "lucide-react";
import DeleteTeam from "./(components)/delete-team";
import LeaveTeam from "./(components)/leave-team";

export default async function IndividualTeamsPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { teamId } = params;
  const team = await getTeam(teamId);
  if (!team) {
    return <div>Team not found</div>;
  }

  const session = await getServerAuthSession();
  const isCaptain = session?.user.id == team.captainId;

  async function removeFromTeam(formData: FormData) {
    "use server";
    const userId = formData.get("userId") as string;
    await db
      .delete(teamsToUsers)
      .where(
        and(eq(teamsToUsers.teamId, teamId), eq(teamsToUsers.userId, userId)),
      );
    revalidatePath(`/teams/${teamId}`);
  }

console.log(team);

  return (
    <main className="">
      <div className="flex flex-row gap-2">
        <h1 className="text-2xl">{team.name}</h1>
        {isCaptain && <EditTeamName name={team.name} teamId={teamId} />}
        {isCaptain && <DeleteTeam team={team} />}
        {!isCaptain && <LeaveTeam team={team} />}
      </div>
      <div className="flex flex-col gap-2">
        {team.captain && (
          <div className="flex flex-row gap-2">
            <img
              className="h-16 w-16 rounded-full bg-accent p-1"
              src={
                team.captain.image ??
                "https://seeklogo.com/images/P/purdue-university-pete-logo-7369E2F18A-seeklogo.com.png"
              }
              alt={team.captain.name ?? team.captain.email}
            />
            <div>Captain: {team.captain.name}</div>
          </div>
        )}
        {team.users.map((user) => (
          <div className="flex flex-row gap-2" key={user.id}>
            <img
              className="h-16 w-16 rounded-full bg-accent p-1"
              src={
                user.image ??
                "https://seeklogo.com/images/P/purdue-university-pete-logo-7369E2F18A-seeklogo.com.png"
              }
              alt={user.name ?? user.email}
            />
            <div>{user.name}</div>
            {session?.user.id == team.captainId && (
              <form action={removeFromTeam}>
                <input type="hidden" name="userId" value={user.id} />
                <Button type="submit">Remove</Button>
              </form>
            )}
          </div>
        ))}
        {isCaptain && <AddMembers joinId={team.joinId} />}
      </div>
    </main>
  );
}
