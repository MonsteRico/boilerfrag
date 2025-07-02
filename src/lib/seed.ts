import { db } from "../server/db/index";
import { users, games, brackets } from "../server/db/schema";
import { eq, count, sql, and, not, like } from "drizzle-orm";

import promptSync from "prompt-sync";

const prompt = promptSync();

const esportGames = [
  {
    fullName: "League of Legends",
    shortName: "LoL",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/7/7f/League_of_Legends_logo.png",
    minimumPlayersPerTeam: 5,
  },
  {
    fullName: "Counter-Strike: Global Offensive",
    shortName: "CS:GO",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/6/6f/CSGOcoverMarch2020.jpg",
    minimumPlayersPerTeam: 5,
  },
  {
    fullName: "Valorant",
    shortName: "Valorant",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/5/5f/Valorant_logo_-_pink.svg",
    minimumPlayersPerTeam: 5,
  },
  {
    fullName: "Rocket League",
    shortName: "RL",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/c/c1/Rocket_League_coverart.jpg",
    minimumPlayersPerTeam: 3,
  },
  {
    fullName: "Overwatch",
    shortName: "OW",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/5/51/Overwatch_cover_art.jpg",
    minimumPlayersPerTeam: 5,
  },
  {
    fullName: "Super Smash Bros. Ultimate",
    shortName: "SSBU",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/5/50/Super_Smash_Bros._Ultimate.jpg",
    minimumPlayersPerTeam: 1,
  },
  {
    fullName: "Fortnite",
    shortName: "Fortnite",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Fortnite_%282017%29.jpg/220px-Fortnite_%282017%29.jpg",
    minimumPlayersPerTeam: 1,
  },
  {
    fullName: "Apex Legends",
    shortName: "Apex",
    coverArt:
      "https://upload.wikimedia.org/wikipedia/en/3/3e/Apex_legends_cover.jpg",
    minimumPlayersPerTeam: 3,
  },
  {
    fullName: "Generic Game",
    shortName: "GEN",
    coverArt: "https://cdn-icons-png.flaticon.com/512/727/727399.png", // game controller icon
    minimumPlayersPerTeam: 1,
  },
];

function randomWord() {
  const words = [
    "alpha",
    "bravo",
    "charlie",
    "delta",
    "echo",
    "foxtrot",
    "golf",
    "hotel",
    "india",
    "juliet",
    "kilo",
    "lima",
    "mike",
    "november",
    "oscar",
    "papa",
    "quebec",
    "romeo",
    "sierra",
    "tango",
    "uniform",
    "victor",
    "whiskey",
    "xray",
    "yankee",
    "zulu",
    "apple",
    "banana",
    "cherry",
    "date",
    "fig",
    "grape",
    "kiwi",
    "lemon",
    "mango",
    "nectarine",
    "orange",
    "peach",
    "pear",
    "plum",
    "quince",
    "raspberry",
    "strawberry",
    "tomato",
    "ugli",
    "vanilla",
    "watermelon",
    "yam",
    "zucchini",
  ];
  return words[Math.floor(Math.random() * words.length)];
}

async function main() {
  // Ask if user wants to empty the database
  const answer = prompt(
    "Do you want to empty the database completely? (y/N): ",
  );
  if (answer.toLowerCase() === "y") {
    // Get all users with legitimate emails (not ending in @test.com)
    const legitUsers = await db
      .select()
      .from(users)
      .where(not(like(users.email, "%@test.com")));
    // Truncate all tables except users
    await db.execute(
      sql`TRUNCATE TABLE boilerfrag_bracket_entries, boilerfrag_users_to_bracket_entries, boilerfrag_bracket, boilerfrag_game, boilerfrag_account, boilerfrag_session, boilerfrag_verification_token RESTART IDENTITY CASCADE;`,
    );
    // Delete only test users from users table
    await db.delete(users).where(like(users.email, "%@test.com"));
    // Re-insert legitimate users if needed (should not be deleted, but just in case)
    // (Not needed if only test users are deleted)
    console.log(`Database emptied (except legitimate users).`);
  }

  // --- USERS ---
  // Only count test users
  const testUsers = await db
    .select()
    .from(users)
    .where(like(users.email, "%@test.com"));
  let toCreate = 128 - testUsers.length;
  if (toCreate > 0) {
    const newUsers = [];
    for (let i = 0; i < toCreate; i++) {
      const word = randomWord();
      const num = Math.floor(Math.random() * 10000);
      newUsers.push({
        id: crypto.randomUUID(),
        name: `${word}#${num}`,
        email: `${word}${num}@test.com`,
        role: "player" as const,
        emailVerified: new Date(),
      });
    }
    for (const user of newUsers) {
      await db.insert(users).values(user);
    }
    console.log(`Created ${toCreate} users.`);
  } else {
    console.log("Test user count already at or above 128.");
  }

  // --- GAMES ---
  const existingGames = await db.select().from(games);
  const missingGames = esportGames.filter(
    (g) => !existingGames.some((eg) => eg.fullName === g.fullName),
  );
  if (missingGames.length > 0) {
    await db.insert(games).values(missingGames);
    console.log(`Created ${missingGames.length} games.`);
  } else {
    console.log("All esport games already present.");
  }

  // --- BRACKETS ---
  const allGames = await db.select().from(games);
  const formats: ["single_elimination", "double_elimination"] = [
    "single_elimination",
    "double_elimination",
  ];
  let createdBrackets = 0;
  for (const game of allGames) {
    for (const format of formats) {
      // Check if bracket exists
      const existing = await db
        .select()
        .from(brackets)
        .where(and(eq(brackets.gameId, game.id), eq(brackets.format, format)));
      if (existing.length === 0) {
        // Pick random team count and group size
        const maxTeamCount = Math.random() < 0.5 ? 8 : 16;
        const maxGroupSize = Math.random() < 0.5 ? 2 : 3;
        const maxTeamSize = game.minimumPlayersPerTeam;
        const maxPlayerCount = maxTeamCount * maxTeamSize;
        await db.insert(brackets).values({
          gameId: game.id,
          name: `${game.fullName} ${format.replace("_", " ")}`,
          format,
          maxTeamSize,
          maxGroupSize,
          maxPlayerCount,
          maxTeamCount,
          stage: "REGISTRATION",
        });
        createdBrackets++;
      }
    }
  }
  console.log(`Created ${createdBrackets} brackets.`);

  console.log("Seeding complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
