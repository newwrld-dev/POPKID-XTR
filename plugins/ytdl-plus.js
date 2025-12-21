const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
  pattern: "play",
  alias: ["song", "music"],
  desc: "Advanced tech audio downloader.",
  category: "download",
  use: ".play <query>",
  react: "🎵",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {
  try {
    if (!q) return reply("⚙️ *SYSTEM:* Input required.");

    // --- SINGLE BOX: INITIALIZING ---
    let techMsg = `╔══════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────╢
│ ✞︎ **sᴛᴀᴛᴜs:** sᴄᴀɴɴɪɴɢ... 📡
│ ✞︎ **ᴛᴀʀɢᴇᴛ:** ${q.substring(0, 15)}
│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▭▭▭▭] 30%
╚════════════════╝`;

    const { key } = await conn.sendMessage(from, { text: techMsg }, { quoted: mek });

    const url = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.status || !data.result?.download_url) {
      return await conn.sendMessage(from, { text: "❌ **FATAL ERROR:** DATA NOT FOUND", edit: key });
    }

    const song = data.result;

    // --- SINGLE BOX: FINAL SELECTION ---
    let selectionMsg = `╔════════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰
╟───────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${song.title.substring(0, 20)}
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${song.duration || 'N/A'}
│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▬▬▬▬] 100%
╟───────────────╢
│  **sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:**
│
│  1 ➮ ᴀᴜᴅɪᴏ (ᴍᴘ3) 🎵
│  2 ➮ ᴅᴏᴄᴜᴍᴇɴᴛ (ғɪʟᴇ) 📂
│  3 ➮ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ (ᴘᴛᴛ) 🎤
╚═════════════════╝
> *Reply with 1, 2, or 3*`;

    await conn.sendMessage(from, { text: selectionMsg, edit: key });

    // --- INTERACTIVE LISTENER ---
    const listener = async (msg) => {
      // Check if it's a reply to the bot's selection message
      const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

      if (isReply && msg.key.remoteJid === from && ['1', '2', '3'].includes(body)) {
        conn.ev.off('messages.upsert', listener); // Stop listening after valid input

        let commonConfig = {
          audio: { url: song.download_url },
          mimetype: "audio/mpeg",
          contextInfo: {
            externalAdReply: {
              title: "『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 』",
              body: song.title,
              thumbnailUrl: song.thumbnail || config.MENU_IMAGE_URL,
              sourceUrl: "https://github.com/popkidmd/POPKID-MD",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        };

        if (body === '1') {
          await conn.sendMessage(from, { ...commonConfig }, { quoted: mek });
        } else if (body === '2') {
          await conn.sendMessage(from, {
            document: { url: song.download_url },
            mimetype: "audio/mpeg",
            fileName: `${song.title}.mp3`
          }, { quoted: mek });
        } else if (body === '3') {
          await conn.sendMessage(from, { ...commonConfig, ptt: true }, { quoted: mek });
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      }
    };

    conn.ev.on('messages.upsert', async (chatUpdate) => {
      for (const msg of chatUpdate.messages) {
        await listener(msg);
      }
    });

  } catch (err) {
    console.error(err);
    reply("⚠️ **SYSTEM ERROR.**");
  }
});
