const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const express = require("express");

// =========================
// WEB SERVER
// =========================

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("FARM Bot läuft!");
});

app.listen(PORT, () => {
  console.log(`Webserver läuft auf Port ${PORT}`);
});

// =========================
// BOT
// =========================

const TOKEN = process.env.TOKEN;
const clientId = "1511358898018189482";

// =========================
// COUNTING VARS
// =========================

let countingActive = false;
let currentNumber = 1;
let lastUserId = null;

// =========================
// IDs (DEIN SYSTEM)
// =========================

const WELCOME_CHANNEL_ID = "";

const ROLE_1_ID = "1498756244343881822";
const ROLE_2_ID = "1499063087960031462";

const SUPPORT_WARTE_RAUM_ID = "1498756245669282065";
const SUPPORT_LOG_CHANNEL_ID = "1498756245417365672";
const SUPPORT_ROLE_ID = "1498756244377305139";

// =========================
// CLIENT (EINZIGER CLIENT)
// =========================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// SLASH COMMAND
// =========================

const commands = [
  new SlashCommandBuilder()
    .setName("countingstart")
    .setDescription("Startet das Counting")
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log("Slash Commands registriert.");
  } catch (error) {
    console.error(error);
  }
})();

// =========================
// READY
// =========================

client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} ist online!`);
});

// =========================
// JOIN SYSTEM
// =========================

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await member.roles.add(ROLE_1_ID);
    await member.roles.add(ROLE_2_ID);

    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("⚡️ Logging ⚡️")
      .setDescription(
`${member} ist gejoined!

UserId: ${member.id}

Aktuelle Memberanzahl: ${member.guild.memberCount}`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Join Fehler:", err);
  }
});

// =========================
// VOICE SUPPORT
// =========================

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  try {
    if (
      newState.channelId === SUPPORT_WARTE_RAUM_ID &&
      oldState.channelId !== SUPPORT_WARTE_RAUM_ID
    ) {

      const logChannel = newState.guild.channels.cache.get(SUPPORT_LOG_CHANNEL_ID);
      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("🎧 Voice-Support benötigt!")
        .setDescription(
`👤 Spieler: ${newState.member}
📞 Kanal: ${newState.channel}
⏰ Zeit: <t:${Math.floor(Date.now() / 1000)}:R>`
        )
        .setTimestamp();

      await logChannel.send({
        content: `<@&${SUPPORT_ROLE_ID}>`,
        embeds: [embed]
      });
    }
  } catch (err) {
    console.error("Voice Fehler:", err);
  }
});

// =========================
// SLASH + COUNTING
// =========================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "countingstart") {
    countingActive = true;
    currentNumber = 1;
    lastUserId = null;

    await interaction.reply("🎉 Counting gestartet bei **1**!");
  }
});

// =========================
// COUNTING SYSTEM
// =========================

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!countingActive) return;

    if (!/^\d+$/.test(message.content)) return;

    const number = parseInt(message.content);

    // Gleicher User 2x hintereinander
    if (message.author.id === lastUserId) {
        await message.channel.send(
            '❌ Du kannst nicht zweimal hintereinander zählen! Reset auf **1**'
        );

        currentNumber = 1;
        lastUserId = null;
        return;
    }

    // Richtige Zahl
    if (number === currentNumber) {

        await message.react('✅');

        lastUserId = message.author.id;
        currentNumber++;

        // Bei 100000 wieder auf 1
        if (currentNumber > 100000) {
            await message.channel.send(
                '🎉 100000 erreicht! Das Counting startet wieder bei **1**.'
            );

            currentNumber = 1;
            lastUserId = null;
        }

    } else {

        await message.channel.send(
            `❌ Falsch! Erwartet war **${currentNumber}**. Reset auf **1**`
        );

        currentNumber = 1;
        lastUserId = null;
    }
});

// =========================
// LOGIN
// =========================

client.login(TOKEN);
