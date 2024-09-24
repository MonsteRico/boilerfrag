import { Button } from "@/components/ui/button";
import { Team } from "@/lib/utils";
import { getTeam } from "@/server/actions/teams/getTeam";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { Bracket, Game, teams, teamsToUsers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { User } from "next-auth";
import RegisterButton from "./(components)/register-button";

export default async function BracketsPage() {
  const session = await getServerAuthSession();
  const brackets = await db.query.brackets.findMany({
    with: {
      game: true,
      teams: {
        with: {
          users: true,
        },
      },
      users: true,
    },
  });

  const myTeamIds = await db.query.teams.findMany({
    where: eq(teams.captainId, session?.user.id ?? ""),
  });
  let teamsInIds = await db
    .select({ teamId: teamsToUsers.teamId })
    .from(teamsToUsers)
    .where(eq(teamsToUsers.userId, session?.user.id ?? ""));

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
      <h1>Brackets</h1>
      {brackets.map((bracket) => {
        const registeredTeamIds = bracket.teams.map((team) => team.id);
        const registeredUserIds = bracket.users.map((user) => user.userId);
        const userIsRegistered =
          registeredUserIds.includes(session?.user.id ?? "") ||
          myTeams.some((team) => registeredTeamIds.includes(team.id)) ||
          teamsIn.some((team) => registeredTeamIds.includes(team.id));
        if (!bracket.game) {
          return null;
        }
        return (
          <BracketCard
            key={bracket.id}
            bracket={bracket}
            userIsRegistered={userIsRegistered}
            myTeams={myTeams}
          />
        );
      })}
    </main>
  );
}

function BracketCard({
  bracket,
  userIsRegistered,
  myTeams,
}: {
  bracket: Bracket & { game: Game | null; teams: Team[]; users: User[] };
  userIsRegistered: boolean;
  myTeams: Team[];
}) {
  console.log(bracket);
  if (!bracket.game) {
    return null;
  }
  const numberPlayers = bracket.users.length;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl underline">{bracket.name}</h2>
      <div className="flex flex-row gap-2">
        <img
          className="h-16 w-16 rounded-full bg-accent p-1"
          src={bracket.game.coverArt}
          alt={bracket.game.fullName}
        />
        <div>{bracket.game.fullName}</div>
      </div>
      <div className="flex flex-row gap-2">
        <div>{bracket.format}</div>
        <p>{bracket.stage}</p>
        <div>
          {bracket.individualAndGroupSignup ? "Individual/Group" : "Team"}
        </div>
      </div>
      <div className="flex flex-row gap-2">
       <p>
          Max {bracket.individualAndGroupSignup ? "Group" : "Team"} Size:{" "}
          {bracket.maxTeamSize}
        </p>
        {!bracket.individualAndGroupSignup && <p>Min Team Size: {bracket.game.minimumPlayersPerTeam}</p>}
        {!bracket.individualAndGroupSignup && (
          <p>Max Team Count: {bracket.maxTeamCount}</p>
        )}
        {!bracket.individualAndGroupSignup && (
          <p>Current Team Count: {bracket.teams.length}</p>
        )}
        {bracket.individualAndGroupSignup && <p>Max Player Count: {bracket.maxPlayerCount}</p>}
        {bracket.individualAndGroupSignup && <p>Current Player Count: {numberPlayers}</p>}
      </div>
      {!userIsRegistered && (
        <RegisterButton teams={myTeams} bracketId={bracket.id} />
      )}
    </div>
  );
}
