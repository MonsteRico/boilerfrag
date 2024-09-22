"use client";
import { Button } from "@/components/ui/button";
import { Team } from "@/lib/utils";
import { deleteTeam } from "@/server/actions/deleteTeam";
import { leaveTeam } from "@/server/actions/leaveTeam";
import { LogOut, Trash } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React from "react";
import toast from "react-hot-toast";

function LeaveTeam({ team }: { team: Team }) {
  const { data: session } = useSession();
  const router = useRouter();
  if (!session) {
    return null;
  }

  return (
    <Button
      variant={"ghost"}
      onClick={async () => {
        await leaveTeam(team.id);
        toast.success("You have left the team");
        router.push(`/teams`);
      }}
    >
      <LogOut />
    </Button>
  );
}

export default LeaveTeam;
