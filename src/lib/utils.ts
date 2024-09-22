import { clsx, type ClassValue } from "clsx"
import { User } from "next-auth";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface Team  {
  id: string;
  name: string;
  captainId: string;
  captain: User;
  users: User[];
  createdAt: Date;
  updatedAt: Date | null;
  gameId: string;
  joinId: string;
  bracketId: string | null;
}