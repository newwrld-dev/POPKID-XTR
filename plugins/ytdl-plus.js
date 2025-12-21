const { cmd } = require('../command');
const config = require('../config');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
  pattern: "play",
  alias: ["song", "music"],
  desc: "High-tech audio extraction with format selection.",
  category: "download",
  use: ".play <song name>",
  react: "🛰️",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {
  try {
    if (!q) return reply("⚙️ *SYSTEM:* Input required. Please provide a song name.");

    // --- PHASE 1: SYSTEM SCAN ---
    let techMsg = `╔═══════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟─────────────╢
│ ✞︎ **sᴛᴀᴛᴜs:** sᴄᴀɴɴɪɴɢ... 📡
│ ✞︎ **ᴛᴀʀɢᴇᴛ:** ${q.substring(0, 15)}...
╟─────────────╢
 [▬▬▬▭▭▭▭▭▭▭] 30%
╚═══════════════╝`;

    const { key } = await conn.sendMessage(from, { text: techMsg }, { quoted: mek });

    // Handle URL or Search
    let videoUrl, title, timestamp, thumbnail;
    if (q.match(/(youtube\.com|youtu\.be)/)) {
        videoUrl = q;
        const videoId = q.split(/[=/]/).pop();
        const videoInfo = await yts({ videoId });
        title = videoInfo.title;
        timestamp = videoInfo.timestamp;
        thumbnail = videoInfo.thumbnail;
    } else {
        const search = await yts(q);
        if (!search.videos.length) return await conn.sendMessage(from, { text: "❌ **CORE ERROR:** NOT FOUND", edit: key });
        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
        timestamp = search.videos[0].timestamp;
        thumbnail = search.videos[0].thumbnail;
    }

    // --- PHASE 2: FORMAT SELECTION ---
    let selectionMsg = `╔══════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟─────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${title.toUpperCase().substring(0, 20)}
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${timestamp}
╟─────────────╢
│  **sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:**
│
│  1 ➮ ᴀᴜᴅɪᴏ (ᴍᴘ3) 🎵
│  2 ➮ ᴅᴏᴄᴜᴍᴇɴᴛ (ғɪʟᴇ) 📂
│  3 ➮ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ (ᴘᴛᴛ) 🎤
╟─────────────╢
 [▬▬▬▬▬▬▬▬▬▬▬] 100%
╚═══════════════╝
> *Reply with 1, 2, or 3*`;

    await conn.sendMessage(from, { text: selectionMsg, edit: key });

    // --- PHASE 3: INTERACTIVE LISTENER ---
    const listener = async (msg) => {
      // Check if it's a reply to the bot's selection message
      const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

      if (isReply && msg.key.remoteJid === from && ['1', '2', '3'].includes(body)) {
        conn.ev.off('messages.upsert', listener); // Stop listening

        // Update Box to show Downloading
        await conn.sendMessage(from, { text: selectionMsg.replace('sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:', '📥 **ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀᴜᴅɪᴏ...**'), edit: key });

        const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) return await conn.sendMessage(from, { text: "❌ **FATAL ERROR:** DOWNLOAD FAILED", edit: key });

        let commonConfig = {
          audio: { url: data.result.download_url },
          mimetype: "audio/mpeg",
          contextInfo: {
            externalAdReply: {
              title: "『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 』",
              body: title,
              thumbnailUrl: thumbnail || config.MENU_IMAGE_URL,
              sourceUrl: videoUrl,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        };

        if (body === '1') {
          await conn.sendMessage(from, { ...commonConfig }, { quoted: mek });
        } else if (body === '2') {
          await conn.sendMessage(from, {
            document: { url: data.result.download_url },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
          }, { quoted: mek });
        } else if (body === '3') {
          await conn.sendMessage(from, { ...commonConfig, ptt: true }, { quoted: mek });
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      }
    };

    conn.ev.on('messages.upsert', async (chatUpdate) => {
      for (const msg of chatUpdate.messages) { await listener(msg); }
    });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { text: "⚠️ **SYSTEM FATAL ERROR**", edit: key });
  }
});
