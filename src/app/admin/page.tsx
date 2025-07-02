import { BracketCard } from "@/components/bracket-card";
import CreateBracketForm from "@/components/bracket-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { deleteBracket } from "@/server/actions/brackets/deleteBracket";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session) {
    redirect("/");
  }
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!user) {
    redirect("/");
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    redirect("/");
  }
  const games = await db.query.games.findMany();
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
      <h1>Admin Page</h1>
      <CreateBracketForm games={games} mode="create" />
      <div className="grid grid-cols-5 gap-2">
        {brackets.map((bracket) => (
          <BracketCard
            key={bracket.id}
            bracket={bracket}
            userIsAdmin={true}
            showRegisterButton={false}
            showEditButton={true}
          />
        ))}
      </div>
    </main>
  );
}
