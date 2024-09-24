"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Team } from "@/lib/utils";
import { registerTeam } from "@/server/actions/brackets/registerTeam";
import { registerUser } from "@/server/actions/brackets/registerUser";
import React from "react";
import toast from "react-hot-toast";

function RegisterButton({
  teams,
  bracketId,
}: {
  teams: Team[];
  bracketId: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button>Register</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={async () => {
            try {
              await registerUser(bracketId);
              toast.success("Registered");
            } catch (e) {
              // @ts-expect-error
              toast.error(e.message);
            }
          }}
        >
          Register Just Me
        </DropdownMenuItem>
        {teams.map((team) => (
          <DropdownMenuItem
            onClick={async () => {
              try {
                await registerTeam(bracketId, team.id);
                toast.success("Registered");
              } catch (e) {
                // @ts-expect-error
                toast.error(e.message);
              }
            }}
            key={team.id}
          >
            {team.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RegisterButton;
