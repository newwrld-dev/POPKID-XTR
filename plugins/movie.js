const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

// POPKID VERIFIED CONTACT
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
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || "0000000000"}:+${config.OWNER_NUMBER || "0000000000"}
END:VCARD`
    }
  }
};

cmd({
  pattern: "movie",
  alias: ["film", "baiscope", "mv"],
  react: "🎬",
  desc: "Download movies (SriHub Baiscope API)",
  category: "movies",
  use: ".movie <movie name>",
  filename: __filename
}, async (conn, mek, m, { from, q, sender }) => {

  const newsletterConfig = {
    contextInfo: {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363289379419860@newsletter",
        newsletterName: "𝐏𝐎𝐏𝐊𝐈𝐃",
        serverMessageId: 321
      }
    }
  };

  try {
    if (!q) {
      return conn.sendMessage(from, {
        text: "🎬 *Movie Downloader*\n\nUsage:\n.movie Ne Zha",
        ...newsletterConfig
      }, { quoted: quotedContact });
    }

    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

    const api = `https://api.srihub.store/movie/baiscope?apikey=dew_HFHK1BMLQLKAKmm3QfE5oIKEWwFFIUwX4zwBeEDK&q=${encodeURIComponent(q)}`;
    const res = await axios.get(api, { timeout: 20000 });

    if (!res.data || !res.data.status || !res.data.result?.length) {
      return conn.sendMessage(from, {
        text: `❌ No movie found for *${q}*`,
        ...newsletterConfig
      }, { quoted: quotedContact });
    }

    // Pick first (best match)
    const movie = res.data.result[0];

    const title = movie.title || q;
    const quality = movie.quality || "Unknown";
    const size = movie.size || "Unknown";
    const downloadUrl = movie.url;
    const thumb = movie.thumb;

    await conn.sendMessage(from, {
      image: thumb ? { url: thumb } : undefined,
      caption: `
🎬 *${title}*
📽️ Quality: ${quality}
📦 Size: ${size}

> Downloading movie...
      `.trim(),
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

    // Download movie
    const videoRes = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 180000,
      maxContentLength: 1024 * 1024 * 1500 // 1.5GB
    });

    const buffer = Buffer.from(videoRes.data);

    if (!buffer || buffer.length < 10000) {
      return conn.sendMessage(from, {
        text: "⚠️ Movie file is invalid or too small.",
        ...newsletterConfig
      }, { quoted: quotedContact });
    }

    // SEND AS DOCUMENT (NO COMPRESSION)
    await conn.sendMessage(from, {
      document: buffer,
      mimetype: "video/mp4",
      fileName: `${title} (${quality}).mp4`,
      caption: `🎬 ${title}\n✅ Download complete`,
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Movie Error:", err);
    await conn.sendMessage(from, {
      text: "❌ Failed to download movie. Try another title.",
      ...newsletterConfig
    }, { quoted: quotedContact });
  }
});
