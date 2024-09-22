"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Button } from "./ui/button";
import { Game } from "@/server/db/schema";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createTeam } from "@/server/actions/createTeam";
import { Label } from "./ui/label";

function CreateTeamForm({ games }: { games: Game[] }) {
  const [name, setName] = useState("");
  const [game, setGame] = useState<Game | undefined>(undefined);

  const { data: session } = useSession();
  const router = useRouter();

  async function handleSubmit() {
    if (!name || !game) {
      toast.error("Please fill out all fields");
      return;
    }
    if (!session) {
      toast.error("Please log in");
      return;
    }
    toast("Creating team...");
    const newTeam = await createTeam(name, game.id);
    toast.success("Team created!");
    router.push(`/teams/${newTeam.id}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="teamName">Team/Group Name</Label>
      <Input
        type="text"
        id="teamName"
        name="teamName"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Label htmlFor="game">Game</Label>
      <Select
        value={undefined}
        onValueChange={(value) => {
          const getGame = games.find((game) => game.id === value);
          setGame(getGame);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a game" />
        </SelectTrigger>
        <SelectContent>
          {games.map((game) => (
            <SelectItem key={game.id} value={game.id}>
              {game.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex justify-between">
        <div className="flex w-1/2 justify-center">
          <Button onClick={handleSubmit}>Create</Button>
        </div>
        <div className="w-1/2">
          {game && game.coverArt && (
            <img src={game.coverArt} alt={game.fullName} />
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateTeamForm;
