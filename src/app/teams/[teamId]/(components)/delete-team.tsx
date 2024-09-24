"use client";
import { Button } from "@/components/ui/button";
import { Team } from "@/lib/utils";
import { deleteTeam } from "@/server/actions/teams/deleteTeam";
import { Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";

function DeleteTeam({ team }: { team: Team }) {
    const {data: session} = useSession();
    const router = useRouter();
    if (!session) {
        return null;
    }

  return (
    <Button
      variant={"ghost"}
      onClick={async () => {
        if (team.users.map((user) => user.id).filter((id) => id !== session.user.id).length > 0) {
            toast.error("Cannot delete team with members");
            return;
        }
        await deleteTeam(team.id);
        toast.success("Team deleted");
        router.push(`/teams`);
      }}
    >
      <Trash />
    </Button>
  );
}

export default DeleteTeam;
