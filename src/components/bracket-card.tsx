"use client";

import { Bracket, BracketEntry, Game } from "@/server/db/schema";
import { Button } from "./ui/button";
import { deleteBracket } from "@/server/actions/brackets/deleteBracket";
import { registerUser } from "@/server/actions/brackets/registerUser";
import toast from "react-hot-toast";
import CreateBracketForm from "./bracket-form";

export function BracketCard({
  bracket,
  userIsAdmin = false,
  showRegisterButton = true,
  showEditButton = false,
}: {
  bracket: Bracket & {
    game: Game | null;
    bracketEntries: (BracketEntry & {
      users: { userId: string; bracketEntryId: string }[];
    })[];
  };

  userIsAdmin?: boolean;
  showRegisterButton?: boolean;
  showEditButton?: boolean;
}) {
  console.log(bracket);
  if (!bracket.game) {
    return null;
  }
  const numberPlayers = bracket.bracketEntries
    .map((entry) => entry.users.length)
    .reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-col gap-2 rounded-md bg-accent p-2">
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
      </div>
      <div className="flex flex-row gap-2">
        <p>Max Player Count: {bracket.maxPlayerCount}</p>
        <p>Current Player Count: {numberPlayers}</p>
      </div>
      {showRegisterButton && (
        <Button
          onClick={async () => {
            try {
              await registerUser(bracket.id);
              toast.success("Registered");
            } catch (e) {
              // @ts-expect-error
              toast.error(e.message);
            }
          }}
        >
          Register
        </Button>
      )}
      {userIsAdmin && (
        <Button onClick={() => deleteBracket(bracket.id)}>Delete</Button>
      )}
      {showEditButton && userIsAdmin && (
        <CreateBracketForm
          games={[bracket.game]}
          mode="edit"
          bracket={bracket}
        />
      )}
    </div>
  );
}
