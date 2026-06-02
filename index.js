const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder
} = require("discord.js");

const express = require("express");

// =========================
// WEB SERVER FÜR RENDER
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
// DISCORD BOT
// =========================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// =========================
// ENV TOKEN
// =========================

const TOKEN = process.env.TOKEN;

// =========================
// IDs HIER EINTRAGEN
// =========================

const WELCOME_CHANNEL_ID = "1498756245002125523";

const ROLE_1_ID = "1498756244343881822";
const ROLE_2_ID = "1499063087960031462";

// Voice Support
const SUPPORT_WARTE_RAUM_ID = "1498756245669282065";
const SUPPORT_LOG_CHANNEL_ID = "1498756245417365672";
const SUPPORT_ROLE_ID = "1498756244377305139";

// =========================
// BOT READY
// =========================

client.once(Events.ClientReady, () => {
  console.log(`${client.user.tag} ist online!`);
});

// =========================
// MEMBER JOIN EVENT (FIXED)
// =========================

client.on(Events.GuildMemberAdd, async (member) => {

  try {

    // 🔧 FIX: Rollen sicher holen
    const role1 = member.guild.roles.cache.get(ROLE_1_ID);
    const role2 = member.guild.roles.cache.get(ROLE_2_ID);

    // 🔧 FIX: Rollen nur geben wenn vorhanden
    if (role1) await member.roles.add(role1).catch(console.error);
    if (role2) await member.roles.add(role2).catch(console.error);

    // 🔧 FIX: Channel sicher holen
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);

    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("⚡️ Logging ⚡️")
      .setDescription(
`${member.user.tag} ist gejoined!

UserId: ${member.id}

Aktuelle Memberanzahl: ${member.guild.memberCount}`
      )
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(member.user.displayAvatarURL({ size: 1024 }))
      .setFooter({ text: "powered by FARM" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error("Fehler beim Join:", err);
  }

});

// =========================
// VOICE SUPPORT SYSTEM
// =========================

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {

  if (
    newState.channelId === SUPPORT_WARTE_RAUM_ID &&
    oldState.channelId !== SUPPORT_WARTE_RAUM_ID
  ) {

    try {

      const logChannel = newState.guild.channels.cache.get(SUPPORT_LOG_CHANNEL_ID);

      if (!logChannel) return;

      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("🎧 Voice-Support benötigt!")
        .setDescription(
`Ein Spieler wartet im Voice-Support Kanal auf Hilfe!

👤 Spieler: ${newState.member}
📞 Kanal: ${newState.channel}
⏰ Zeit: <t:${Math.floor(Date.now() / 1000)}:R>`
        )
        .setThumbnail(newState.member.user.displayAvatarURL())
        .setImage(newState.member.user.displayAvatarURL({ size: 1024 }))
        .setFooter({ text: "FARM Voice-Support" })
        .setTimestamp();

      await logChannel.send({
        content: `<@&${SUPPORT_ROLE_ID}>`,
        embeds: [embed]
      });

    } catch (err) {
      console.error("Voice-Support Fehler:", err);
    }
  }

});

// =========================
// LOGIN
// =========================

client.login(TOKEN);
