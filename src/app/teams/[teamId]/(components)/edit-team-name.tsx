"use client";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogTrigger,
} from "@/components/responsiveDrawerPopover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTeamName } from "@/server/actions/teams/updateTeamName";
import { Pencil } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

function EditTeamName({ name, teamId }: { name: string; teamId: string }) {
  const [newName, setNewName] = React.useState(name);
  const [open, setOpen] = React.useState(false);
  return (
    <DrawerDialog open={open} onOpenChange={(open) => setOpen(open)}>
      <DrawerDialogTrigger asChild>
        <Button variant={"ghost"}>
          <Pencil />
        </Button>
      </DrawerDialogTrigger>
      <DrawerDialogContent>
        <Label htmlFor="teamName">Team/Group Name</Label>
        <Input
          type="text"
          id="teamName"
          name="teamName"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button
          onClick={async () => {
            if (newName == name) {
              setOpen(false);
              return;
            }
            if (newName.trim().length === 0) {
              toast.error("Please enter a name");
              return;
            }
            console.log(teamId);
            await updateTeamName(teamId, newName);
            toast.success("Team name updated!");
            setOpen(false);
          }}
        >
          Update
        </Button>
      </DrawerDialogContent>
    </DrawerDialog>
  );
}

export default EditTeamName;
