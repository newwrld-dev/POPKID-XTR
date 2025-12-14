const axios = require("axios");
const { cmd } = require("../command");
const { ytsearch } = require("@dark-yasiya/yt-dl.js");
const config = require("../config");

// Quoted Contact Message (Popkids Verified)
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "POP KIDS VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:POP KIDS VERIFIED ✅
ORG:POP KIDS BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

cmd({
  pattern: "play2",
  alias: ["ytplay", "song", "yta"],
  react: "🎵",
  desc: "Download YouTube audio using GiftedTech API",
  category: "download",
  use: ".popkidplay <song name or YouTube URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {
  // Newsletter / context info
  const newsletterConfig = {
    contextInfo: {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363289379419860@newsletter',
        newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃',
        serverMessageId: 143
      }
    }
  };

  try {
    const input = q?.trim() || "Fave Mr Man"; // default song if none provided
    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
    await conn.sendMessage(from, { text: `🎧 Searching for: *${input}*`, ...newsletterConfig }, { quoted: quotedContact });

    // 🔍 Search YouTube
    const search = await ytsearch(input);
    const vid = search?.results?.[0];
    if (!vid || !vid.url) return await conn.sendMessage(from, { text: "❌ No results found!", ...newsletterConfig }, { quoted: quotedContact });

    const title = vid.title.replace(/[^\w\s.-]/gi, "").slice(0, 50);
    const videoUrl = vid.url;

    await conn.sendMessage(from, {
      image: { url: vid.thumbnail },
      caption: `
╭╴╴╴╴╴╴╴╴╴╴╴╴╴╴╮
│ 🎶 Now Playing...
╰╴╴╴╴╴╴╴╴╴╴╴╴╴╴╯
📝 Title   : ${vid.title}
⏱️ Duration: ${vid.timestamp || "Unknown"}
👁️ Views   : ${vid.views || "Unknown"}
👤 Author  : ${vid.author?.name || "Unknown"}
> 🎧 Converting to MP3...
┃└─────────────┈⊷
`.trim(),
      ...newsletterConfig
    }, { quoted: quotedContact });

    // 🎧 Use GiftedTech API
    const api = `https://ytapi.giftedtech.co.ke/api/ytdla.php?url=${encodeURIComponent(videoUrl)}&stream=true`;

    const res = await axios.get(api, {
      responseType: "arraybuffer",
      timeout: 60000
    });

    if (!res.data) return await conn.sendMessage(from, { text: "⚠️ Failed to fetch audio data.", ...newsletterConfig }, { quoted: quotedContact });

    await conn.sendMessage(from, {
      audio: Buffer.from(res.data),
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`,
      ptt: false,
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("❌ Error in popkidplay:", err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    await conn.sendMessage(from, { text: "⚠️ Something went wrong while downloading audio!", ...newsletterConfig }, { quoted: quotedContact });
  }
});
