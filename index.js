const express = require("express");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const ROWIFI_KEY = process.env.ROWIFI_KEY;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

// Multiple role IDs
const ROLE_IDS = {
  ServerBooster: process.env.DISCORD_ROLE_SERVERBOOSTER,
  CC: process.env.DISCORD_ROLE_CC,
  CEB: process.env.DISCORD_ROLE_CEB
};

// Helper to safely call APIs
async function requestAsync(url, token) {
  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bot ${token}`
      }
    });

    if (!resp.ok) return null;

    return await resp.json();
  } catch (err) {
    console.error("Request error:", err);
    return null;
  }
}

// Endpoint
app.get("/check/:robloxId", async (req, res) => {
  const robloxId = req.params.robloxId;

  try {
    const rowifiUrl = `https://api.rowifi.xyz/v3/guilds/${DISCORD_GUILD_ID}/members/roblox/${robloxId}`;
    const linkedDiscords = await requestAsync(rowifiUrl, ROWIFI_KEY);

    let results = {
      ServerBooster: false,
      CC: false,
      CEB: false
    };

    if (!Array.isArray(linkedDiscords) || linkedDiscords.length === 0) {
      return res.json(results);
    }

    for (const member of linkedDiscords) {
      if (!member.discord_id) continue;

      const discordUrl = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${member.discord_id}`;
      const discordData = await requestAsync(discordUrl, DISCORD_BOT_TOKEN);

      if (!discordData || !Array.isArray(discordData.roles)) continue;

      if (
        ROLE_IDS.ServerBooster &&
        discordData.roles.includes(ROLE_IDS.ServerBooster)
      ) {
        results.ServerBooster = true;
      }

      if (
        ROLE_IDS.CC &&
        discordData.roles.includes(ROLE_IDS.CC)
      ) {
        results.CC = true;
      }

      if (
        ROLE_IDS.CEB &&
        discordData.roles.includes(ROLE_IDS.CEB)
      ) {
        results.CEB = true;
      }
    }

    return res.json(results);

  } catch (err) {
    console.error("Error checking roles:", err);

    return res.status(500).json({
      ServerBooster: false,
      CC: false,
      CEB: false
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
