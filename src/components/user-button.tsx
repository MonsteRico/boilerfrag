import React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Session } from "next-auth";
import { LogoutButton } from "./login-logout";
function UserButton({ session }: { session: Session }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <img
          className="h-16 w-16 cursor-pointer rounded-full"
          src={
            session.user.image ??
            "https://cdn-icons-png.freepik.com/512/6813/6813762.png"
          }
          alt="avatar"
        />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2 bg-card text-card-foreground">
        <h2 className="text-lg font-bold">Hello {session.user.name}!</h2>
        <LogoutButton />
      </PopoverContent>
    </Popover>
  );
}

export default UserButton;
