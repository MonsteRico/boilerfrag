"use client";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Game, Bracket } from "@/server/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { createBracket } from "@/server/actions/brackets/createBracket";
import { updateBracket } from "@/server/actions/brackets/updateBracket";
import toast from "react-hot-toast";
import { DialogTrigger } from "./ui/dialog";
import { DialogContent } from "./ui/dialog";
import { Dialog } from "./ui/dialog";

const formSchema = z.object({
  name: z.string(),
  gameId: z.string(),
  format: z.string(),
  maxTeamSize: z.number(),
  maxGroupSize: z.number(),
  maxPlayerCount: z.number(),
  maxTeamCount: z.number(),
  stage: z.enum([
    "REGISTRATION",
    "MAKING_TEAMS",
    "EDIT_TEAMS",
    "SET_SEEDS",
    "RUNNING",
    "FINISHED",
  ]),
});

type CreateBracketFormProps = {
  games: Game[];
  mode?: "create" | "edit";
  bracket?: Bracket;
};

const bracketStages = [
  "REGISTRATION",
  "MAKING_TEAMS",
  "EDIT_TEAMS",
  "SET_SEEDS",
  "RUNNING",
  "FINISHED",
] as const;
type BracketStage = (typeof bracketStages)[number];

function CreateBracketForm({
  games,
  mode = "create",
  bracket,
}: CreateBracketFormProps) {
  // 1. Define your form.
  const [stageChanged, setStageChanged] = useState(false);
  const [selectedStage, setSelectedStage] = useState<BracketStage>(
    (bracket?.stage as BracketStage) || "REGISTRATION",
  );

  // For edit mode, get current player count
  const currentPlayerCount =
    bracket && (bracket as any).bracketEntries
      ? (bracket as any).bracketEntries.reduce(
          (acc: number, entry: any) => acc + (entry.users?.length || 0),
          0,
        )
      : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      mode === "edit" && bracket
        ? {
            name: bracket.name,
            gameId: bracket.gameId || "",
            format: bracket.format,
            maxTeamSize: bracket.maxTeamSize,
            maxGroupSize: bracket.maxGroupSize,
            maxPlayerCount: bracket.maxPlayerCount,
            maxTeamCount: bracket.maxTeamCount,
            stage: bracket.stage as BracketStage,
          }
        : {},
  });

  const [extraPlayers, setExtraPlayers] = useState(0);
  const [overrideMaxPlayers, setOverrideMaxPlayers] = useState(false);
  const [overrideValue, setOverrideValue] = useState(0);

  // Watch team size and team count
  const maxTeamSize = form.watch("maxTeamSize") || 0;
  const maxTeamCount = form.watch("maxTeamCount") || 0;
  const totalPlayers = maxTeamSize * maxTeamCount + extraPlayers;

  // Keep maxPlayerCount in sync
  React.useEffect(() => {
    if (!overrideMaxPlayers) {
      form.setValue("maxPlayerCount", totalPlayers);
    } else {
      form.setValue(
        "maxPlayerCount",
        overrideValue < totalPlayers ? totalPlayers : overrideValue,
      );
    }
  }, [
    maxTeamSize,
    maxTeamCount,
    extraPlayers,
    overrideMaxPlayers,
    overrideValue,
  ]);

  // When override toggled on, set overrideValue to calculated value
  React.useEffect(() => {
    if (overrideMaxPlayers) {
      setOverrideValue(totalPlayers);
    }
  }, [overrideMaxPlayers, totalPlayers]);

  // Reset warning and stage when dialog is opened
  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setStageChanged(false);
      setSelectedStage((bracket?.stage as BracketStage) || "REGISTRATION");
      // Reset form to default values
      form.reset(
        mode === "edit" && bracket
          ? {
              name: bracket.name,
              gameId: bracket.gameId || "",
              format: bracket.format,
              maxTeamSize: bracket.maxTeamSize,
              maxGroupSize: bracket.maxGroupSize,
              maxPlayerCount: bracket.maxPlayerCount,
              maxTeamCount: bracket.maxTeamCount,
              stage: bracket.stage as BracketStage,
            }
          : {},
      );
      setOverrideMaxPlayers(false);
      setOverrideValue(0);
      setExtraPlayers(0);
    } else {
      // Reset form to default values when closed
      form.reset(
        mode === "edit" && bracket
          ? {
              name: bracket.name,
              gameId: bracket.gameId || "",
              format: bracket.format,
              maxTeamSize: bracket.maxTeamSize,
              maxGroupSize: bracket.maxGroupSize,
              maxPlayerCount: bracket.maxPlayerCount,
              maxTeamCount: bracket.maxTeamCount,
              stage: bracket.stage as BracketStage,
            }
          : {},
      );
      setStageChanged(false);
      setSelectedStage((bracket?.stage as BracketStage) || "REGISTRATION");
      setOverrideMaxPlayers(false);
      setOverrideValue(0);
      setExtraPlayers(0);
    }
  };

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (mode === "edit" && bracket) {
      await updateBracket({
        id: bracket.id,
        ...values,
        stage: selectedStage as BracketStage,
      });
      toast.success("Bracket updated!");
    } else {
      await createBracket(values);
      toast.success("Bracket created!");
      setOverrideMaxPlayers(false);
      setOverrideValue(0);
      setExtraPlayers(0);
      form.resetField("maxTeamSize");
      form.resetField("maxTeamCount");
      form.resetField("maxGroupSize");
      form.resetField("maxPlayerCount");
      form.resetField("gameId");
      form.resetField("format");
      form.resetField("name");
    }
    setOpen(false);
  }

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button>
          {mode === "edit" ? "Edit bracket" : "Create a new bracket"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex w-full flex-col gap-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Row 1: Bracket Title | Game */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bracket Title</FormLabel>
                      <FormDescription>
                        What is the title of the bracket?
                      </FormDescription>
                      <FormControl>
                        <Input placeholder="Fall 24 Game" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {mode === "edit" && bracket ? (
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bracket Stage</FormLabel>
                        <FormDescription>
                          Change the stage of the bracket.
                        </FormDescription>
                        <FormControl>
                          <Select
                            value={selectedStage}
                            onValueChange={(value) => {
                              setSelectedStage(value as BracketStage);
                              setStageChanged(value !== bracket.stage);
                              field.onChange(value as BracketStage);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {bracketStages.map((stage) => (
                                <SelectItem key={stage} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                        {stageChanged &&
                          currentPlayerCount <
                            (bracket.maxPlayerCount || 0) && (
                            <div className="mt-2 text-sm text-yellow-600">
                              Warning: The bracket is not full. Changing the
                              stage may have unintended consequences.
                            </div>
                          )}
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="gameId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game</FormLabel>
                        <FormDescription>
                          What game are you creating a bracket for?
                        </FormDescription>
                        <FormControl>
                          <Select
                            value={undefined}
                            onValueChange={(value) => {
                              const getGame = games.find(
                                (game) => game.id === value,
                              );
                              field.onChange(getGame?.id);
                              if (getGame) {
                                form.setValue(
                                  "maxTeamSize",
                                  getGame.minimumPlayersPerTeam,
                                );
                              }
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Row 2: Format | Max Team Count */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format</FormLabel>
                      <FormDescription>
                        What format are you creating a bracket for? (Single
                        Elimination or Double Elimination)
                      </FormDescription>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_elimination">
                              Single Elimination
                            </SelectItem>
                            <SelectItem value="double_elimination">
                              Double Elimination
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxTeamCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Team Count</FormLabel>
                      <FormDescription>
                        What is the maximum number of teams that can be in the
                        bracket?
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="Max Team Count"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Max Group Size | Max Team Size */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="maxGroupSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Group Size</FormLabel>
                      <FormDescription>
                        What is the maximum number of players per signup group?
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="Max Group Size"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxTeamSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Team Size</FormLabel>
                      <FormDescription>
                        What is the maximum number of players per team?
                      </FormDescription>
                      <FormControl>
                        <Input
                          placeholder="Max Team Size"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Max Players (full width) */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Max Players
                </label>
                <div className="flex items-center gap-2">
                  <span>{maxTeamCount}</span>
                  <span>x</span>
                  <span>{maxTeamSize}</span>
                  <span>=</span>
                  <span className="font-semibold">{totalPlayers}</span>
                </div>
                <FormDescription>
                  Max Players is calculated as Max Teams × Max Team Size. Once
                  the number of registered players reaches this value,
                  registration for the bracket will be closed automatically.
                </FormDescription>
                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    checked={overrideMaxPlayers}
                    onCheckedChange={setOverrideMaxPlayers}
                    id="override-max-players"
                  />
                  <label htmlFor="override-max-players" className="text-sm">
                    Override Max Players
                  </label>
                  {overrideMaxPlayers && (
                    <Input
                      type="number"
                      className="ml-2 w-24"
                      min={totalPlayers}
                      value={overrideValue}
                      onChange={(e) => {
                        const val = Number(e.target.value) || totalPlayers;
                        setOverrideValue(
                          val < totalPlayers ? totalPlayers : val,
                        );
                      }}
                    />
                  )}
                </div>
                {overrideMaxPlayers && (
                  <FormDescription>
                    You can override the calculated max players. The minimum
                    allowed is the calculated value above.
                  </FormDescription>
                )}
              </div>

              {/* Row 5: Submit (full width) */}
              <Button type="submit">
                {mode === "edit" ? "Save Changes" : "Submit"}
              </Button>
            </form>
          </Form>
        </div>{" "}
      </DialogContent>
    </Dialog>
  );
}

export default CreateBracketForm;
