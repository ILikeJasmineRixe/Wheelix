// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, ChannelType, } = require("discord.js");
const dotenv = require("dotenv");

dotenv.config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let isLoggedIn = false;
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  isLoggedIn = true;
});

client.login(process.env.BOT_TOKEN);

async function bot() {
  try {
    const url = `https://api.mcstatus.io/v2/status/java/${process.env.SERVER_HOST}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    await response;

    const result = await response.json();
    // console.log(result);
    const players = result.players;

    const isOnline = result.online ? "🟢" : "🔴";

    let currentPlayerCount = 0;
    let maxPlayerCount = 0;

    // If the server is online, try reading players
    if (result.online) {
      currentPlayerCount = result.players?.online ?? 0;
      maxPlayerCount = result.players?.max ?? 0;
    }


    console.log(url);


    console.log(`${isOnline} | ${currentPlayerCount}/${maxPlayerCount} Online`);

    if (!isLoggedIn) {
      console.log("bot apparently isnt logged in yet..?");
      return;
    }
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return console.log("Guild not found");

    const category = guild.channels.cache.find(
      (c) =>
        c.name === process.env.CATEGORY_NAME &&
        c.type === ChannelType.GuildCategory
    );

    if (!category) return console.log("Category not found");

    let channel = guild.channels.cache.find(
      (c) => c.parentId === category.id && c.type === ChannelType.GuildVoice
    );

    if (channel) {
      console.log(`Using existing channel: ${channel.name}`);
    } else {
      channel = await guild.channels.create({
        name: "temp",
        type: ChannelType.GuildVoice,
        parent: category.id,
        reason: "Channel didnt exist prior",
      });
      console.log("made channel :3");
    }

    await channel.setName(
      `${isOnline} ${currentPlayerCount}/${maxPlayerCount} Online`
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

let runI = 0;
async function main() {
  // Wait for initial login
  await new Promise((resolve) => {
    if (isLoggedIn) {
      resolve();
    } else {
      client.once(Events.ClientReady, resolve);
    }
  });

  while (true) {
    await bot();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    runI++;
    if (runI % 10 === 0) {
      console.clear();
    }
  }
}

main();
