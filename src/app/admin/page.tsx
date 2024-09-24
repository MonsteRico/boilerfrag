import CreateBracketForm from "@/components/create-bracket-form";
import { DrawerDialog, DrawerDialogContent, DrawerDialogTrigger } from "@/components/responsiveDrawerPopover";
import { Button } from "@/components/ui/button";
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
    const user = await db.query.users.findFirst({where:eq(users.id,session.user.id)});
    if (!user) {
        redirect("/");
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
        redirect("/");
    }
    const games = await db.query.games.findMany();
  return (
    <main className="">
      <h1>Admin Page</h1>
      <DrawerDialog>
        <DrawerDialogTrigger asChild>
          <Button>Create a new team/group</Button>
        </DrawerDialogTrigger>
        <DrawerDialogContent>
          <CreateBracketForm games={games} />
        </DrawerDialogContent>
      </DrawerDialog>
    </main>
  );
}
