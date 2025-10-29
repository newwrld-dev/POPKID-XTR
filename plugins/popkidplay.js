const axios = require("axios");
const { cmd } = require("../command");
const { ytsearch } = require("@dark-yasiya/yt-dl.js");

cmd({
  pattern: "popkidplay",
  alias: ["ytplay", "song", "yta"],
  react: "🎵",
  desc: "Download YouTube audio using GiftedTech API with 1️⃣/2️⃣ options",
  category: "download",
  use: ".popkidplay <song name or YouTube URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    const input = q?.trim() || "Fave Mr Man"; // default search
    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
    await reply(`🎧 Searching for: *${input}*`);

    // Search YouTube
    const search = await ytsearch(input);
    const vid = search?.results?.[0];
    if (!vid || !vid.url) return reply("❌ No results found!");

    const title = vid.title.replace(/[^\w\s.-]/gi, "").slice(0, 50);
    const videoUrl = vid.url;

    // Show song info & options
    const infoMsg = await conn.sendMessage(from, {
      image: { url: vid.thumbnail },
      caption: `
🎶 *${title}*

🕒 Duration: ${vid.timestamp || "Unknown"}
👀 Views: ${vid.views || "Unknown"}
👤 Channel: ${vid.author?.name || "Unknown"}

╭─────────────◆
│ Reply with:
│ 1️⃣ - Download Audio 🎧
│ 2️⃣ - Download as Document 📄
╰─────────────◆
`.trim()
    }, { quoted: mek });

    const promptId = infoMsg.key.id;

    // Listen for user reply
    const handleResponse = async (event) => {
      const message = event.messages[0];
      if (!message.message) return;
      const ctx = message.message.extendedTextMessage?.contextInfo?.stanzaId;
      if (ctx !== promptId) return;

      const userText = message.message.conversation || message.message.extendedTextMessage?.text;
      const choice = userText?.trim();

      await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

      try {
        // Fetch audio
        const api = `https://ytapi.giftedtech.co.ke/api/ytdla.php?url=${encodeURIComponent(videoUrl)}&stream=true`;
        const res = await axios.get(api, { responseType: "arraybuffer", timeout: 60000 });
        const buffer = Buffer.from(res.data);

        if (choice === "1") {
          await conn.sendMessage(from, {
            audio: buffer,
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
          }, { quoted: message });
        } else if (choice === "2") {
          await conn.sendMessage(from, {
            document: buffer,
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
          }, { quoted: message });
        } else {
          return reply("❌ Invalid choice! Reply 1 or 2.", message);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
      } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("⚠️ Failed to download. Try again later!");
      }

      conn.ev.off("messages.upsert", handleResponse);
    };

    // Auto close listener after 3 minutes
    setTimeout(() => conn.ev.off("messages.upsert", handleResponse), 180000);
    conn.ev.on("messages.upsert", handleResponse);

  } catch (err) {
    console.error("❌ Error in popkidplay:", err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply("⚠️ Something went wrong while processing your request!");
  }
});
