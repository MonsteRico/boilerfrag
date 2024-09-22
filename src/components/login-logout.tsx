"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function LoginButton() {
  return <Button onClick={() => signIn()}>Sign in</Button>;
}

export function LogoutButton() {

  return <Button onClick={() => signOut()}>Sign out</Button>;
}
