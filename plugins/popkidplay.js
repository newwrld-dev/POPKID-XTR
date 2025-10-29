const axios = require("axios");
const { cmd } = require("../command");
const { ytsearch } = require("@dark-yasiya/yt-dl.js");

cmd({
  pattern: "popkidplay",
  alias: ["ytplay", "song", "yta"],
  react: "🎵",
  desc: "Download YouTube audio using Jawad-Tech and Noobs APIs",
  category: "download",
  use: ".play <song name or YouTube URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    const input = q || (m.quoted && m.quoted.text?.trim());
    if (!input) return reply("❌ Please enter a song name or YouTube link!");

    await reply("🔍 Searching YouTube...");

    // Search video
    const search = await ytsearch(input);
    const vid = search?.results?.[0];
    if (!vid || !vid.url) return reply("❌ No results found!");

    const title = vid.title.replace(/[^\w\s.-]/gi, "").slice(0, 50);
    const videoUrl = vid.url;
    const videoId = vid.videoId;

    await conn.sendMessage(from, {
      image: { url: vid.thumbnail },
      caption: `
🎶 *Now Playing...*

📝 *Title:* ${vid.title}
⏱️ *Duration:* ${vid.timestamp || "Unknown"}
👁️ *Views:* ${vid.views || "Unknown"}
👤 *Author:* ${vid.author?.name || "Unknown"}

> 🎧 *Downloading audio...*
`.trim()
    }, { quoted: mek });

    // Use only the two APIs you requested
    const apis = [
      `https://jawad-tech.vercel.app/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
      `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp3`
    ];

    let success = false;

    for (const api of apis) {
      try {
        console.log(`Trying API: ${api}`);
        const res = await axios.get(api, { timeout: 30000 });

        // Try different formats for download link
        let audioUrl =
          res.data?.result?.downloadUrl ||
          res.data?.result?.url ||
          res.data?.url ||
          res.data?.downloadLink ||
          res.data?.result;

        if (!audioUrl) {
          console.warn(`No valid audio URL from ${api}`);
          continue;
        }

        await conn.sendMessage(from, {
          audio: { url: audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          ptt: false
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        success = true;
        break;

      } catch (err) {
        console.warn(`API failed: ${api} - ${err.message}`);
        continue;
      }
    }

    if (!success) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply("🚫 All servers failed. Try again later.");
    }

  } catch (err) {
    console.error("❌ Error in .play command:", err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply("⚠️ Something went wrong while downloading audio!");
  }
});
