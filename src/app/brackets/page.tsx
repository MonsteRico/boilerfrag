import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { Bracket, BracketEntry, Game } from "@/server/db/schema";
import { BracketCard } from "@/components/bracket-card";

export default async function BracketsPage() {
  const session = await getServerAuthSession();
  const brackets = await db.query.brackets.findMany({
    with: {
      game: true,
      bracketEntries: {
        with: {
          users: true,
        },
      },
    },
  });

  return (
    <main className="">
      <h1>Brackets</h1>
      <div className="grid grid-cols-5 gap-2">
        {brackets.map((bracket) => {
          const registeredUserIds = bracket.bracketEntries
            .map((entry) => entry.users.map((user) => user.userId))
            .flat();
          const userIsRegistered = registeredUserIds.includes(
            session?.user.id ?? "",
          );
          if (!bracket.game) {
            return null;
          }
          return (
            <BracketCard
              key={bracket.id}
              bracket={bracket}
              showRegisterButton={!userIsRegistered}
            />
          );
        })}
      </div>
    </main>
  );
}
