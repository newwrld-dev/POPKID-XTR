const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

// Quoted Contact (Same style as play.js)
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

// Avoid double-download
const processed = new Set();

cmd({
  pattern: "movie",
  alias: ["film", "downloadmovie", "mk"],
  react: "🎬",
  desc: "Download movies using GiftedTech Movie API",
  category: "movies",
  use: ".movie <movie name>",
  filename: __filename
}, 

async (conn, mek, m, { from, q, sender }) => {

  const newsletterConfig = {
    contextInfo: {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363289379419860@newsletter',
        newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃',
        serverMessageId: 222
      }
    }
  };

  try {

    if (processed.has(mek.key.id)) return;
    processed.add(mek.key.id);
    setTimeout(() => processed.delete(mek.key.id), 5 * 60 * 1000);

    const query = q?.trim();
    if (!query) {
      return conn.sendMessage(from, { 
        text: "🎬 *Provide a movie name to search*\n\nExample:\n.movie Avatar", 
        ...newsletterConfig 
      }, { quoted: quotedContact });
    }

    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
    await conn.sendMessage(from, { 
      text: `🎬 Searching for: *${query}*...`, 
      ...newsletterConfig 
    }, { quoted: quotedContact });

    // 🔍 Search movie
    const searchUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}`;
    const searchRes = await axios.get(searchUrl, { timeout: 15000 });

    if (!searchRes.data || searchRes.data.length === 0) {
      return conn.sendMessage(from, { 
        text: `❌ No results found for *${query}*`, 
        ...newsletterConfig 
      }, { quoted: quotedContact });
    }

    const movie = searchRes.data[0];
    const movieId = movie.id;

    await conn.sendMessage(from, {
      image: { url: movie.image },
      caption: `
🎬 *${movie.title}*
📅 Year: ${movie.year || "Unknown"}
⭐ Rating: ${movie.rating || "N/A"}

> Fetching best download quality...
      `.trim(),
      ...newsletterConfig
    }, { quoted: quotedContact });

    // 🎥 Get sources
    const srcUrl = `https://movieapi.giftedtech.co.ke/api/sources/${movieId}`;
    const srcRes = await axios.get(srcUrl, { timeout: 15000 });

    if (!Array.isArray(srcRes.data) || srcRes.data.length === 0) {
      return conn.sendMessage(from, { 
        text: "⚠️ No download sources available for this movie.", 
        ...newsletterConfig 
      }, { quoted: quotedContact });
    }

    // Choose highest quality
    const sorted = srcRes.data.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));
    const best = sorted[0];

    await conn.sendMessage(from, {
      text: `📥 Downloading *${movie.title}*\nQuality: *${best.quality}p*\n\nPlease wait...`,
      ...newsletterConfig
    }, { quoted: quotedContact });

    // 🎬 Download movie
    const videoResp = await axios.get(best.download_url, {
      responseType: "arraybuffer",
      timeout: 120000,
      maxContentLength: 500 * 1024 * 1024, // 500MB
    });

    const buffer = Buffer.from(videoResp.data);

    if (buffer.length < 5000) {
      return conn.sendMessage(from, { 
        text: "❌ Invalid movie file received.", 
        ...newsletterConfig 
      }, { quoted: quotedContact });
    }

    // 📦 Send as document (.mp4)
    await conn.sendMessage(from, {
      document: buffer,
      mimetype: "video/mp4",
      fileName: `${movie.title}.mp4`,
      caption: `🎬 *${movie.title}*\n📥 Download Complete\nQuality: *${best.quality}p*`,
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Movie Downloader Error:", err);
    await conn.sendMessage(from, { 
      text: "❌ Something went wrong while fetching movie!", 
      ...newsletterConfig 
    }, { quoted: quotedContact });
  }
});
