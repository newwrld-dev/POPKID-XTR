const { cmd } = require('../command');
const config = require('../config');

// Popkids Verified Contact
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
  pattern: "play7",
  alias: ["ytmp3"],
  desc: "Download YouTube song (MP3)",
  category: "main",
  use: ".play7 <song name>",
  react: "🔰",
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
        newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄',
        serverMessageId: 143
      }
    }
  };

  try {
    if (!q) return reply("❗ Please provide a song name.");

    // ⏳ Processing reaction
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    const url = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.status || !data.result?.download_url) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply("❌ No audio found or API error.");
    }

    const song = data.result;

    await conn.sendMessage(from, {
      audio: { url: song.download_url },
      mimetype: "audio/mpeg",
      fileName: `${song.title}.mp3`,
      ...newsletterConfig
    }, { quoted: quotedContact });

    await reply(`🎵 *${song.title}*\nDownloaded Successfully ✅`);

    // ✅ Success reaction
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    reply("⚠️ Error occurred. Try again.", quotedContact);
  }
});
