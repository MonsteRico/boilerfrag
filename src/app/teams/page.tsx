import CreateTeamForm from "@/components/create-team-form";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogTrigger,
} from "@/components/responsiveDrawerPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeam } from "@/server/actions/getTeam";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { teams, teamsToUsers } from "@/server/db/schema";
import { eq } from "drizzle-orm";

import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }

  const games = await db.query.games.findMany();

  const myTeamIds = await db.query.teams.findMany({
    where: eq(teams.captainId, session.user.id),
  });
  let teamsInIds = await db
    .select({ teamId: teamsToUsers.teamId })
    .from(teamsToUsers)
    .where(eq(teamsToUsers.userId, session.user.id));

  // filter out myTeamIds from teamsInIds
  teamsInIds = teamsInIds.filter(
    (teamIn) => !myTeamIds.map((myTeam) => myTeam.id).includes(teamIn.teamId),
  );

  const myTeams = await Promise.all(myTeamIds.map((team) => getTeam(team.id)));
  const teamsIn = await Promise.all(
    teamsInIds.map((team) => getTeam(team.teamId)),
  );

  return (
    <main className="">
      <DrawerDialog>
        <DrawerDialogTrigger asChild>
          <Button>Create a new team/group</Button>
        </DrawerDialogTrigger>
        <DrawerDialogContent>
          <CreateTeamForm games={games} />
        </DrawerDialogContent>
      </DrawerDialog>
      <div>
        <h2>My Teams</h2>
        {myTeams.map((team) => (
          <div key={team.id}>
            <Link href={`/teams/${team.id}`}>{team.name}</Link>
          </div>
        ))}
      </div>
      <div>
        <h2>Teams I'm In</h2>
        {teamsIn.map((team) => (
          <div key={team.id}>
            <Link href={`/teams/${team.id}`}>{team.name}</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
