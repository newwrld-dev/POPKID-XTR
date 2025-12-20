const axios = require("axios");
const { cmd } = require("../command");
const { ytsearch } = require("@dark-yasiya/yt-dl.js");
const config = require("../config");

// POPKID VERIFIED CONTACT
const quotedContact = {
  key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" },
  message: {
    contactMessage: {
      displayName: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴄᴏʀᴇ ✅",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴄᴏʀᴇ ✅\nORG:POP KID TECH;\nTEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}\nEND:VCARD`
    }
  }
};

// API FETCH HELPERS
const AXIOS_DEFAULTS = { timeout: 60000, headers: { 'User-Agent': 'Mozilla/5.0' } };

async function fetchVideo(url, quality) {
  // Primary: Izumi API (Supports format selection)
  const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=${quality}`;
  const res = await axios.get(api, AXIOS_DEFAULTS);
  if (res?.data?.result?.download) return res.data.result.download;
  
  // Fallback: Okatsu (Default HD)
  const fallback = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`;
  const res2 = await axios.get(fallback, AXIOS_DEFAULTS);
  return res2.data.result.mp4;
}

// ───────────────────────────────────────────────
//        ADVANCED VIDEO COMMAND W/ SELECTOR
// ───────────────────────────────────────────────
cmd({
  pattern: "video",
  alias: ["ytvideo", "mp4"],
  react: "🎬",
  desc: "Video extraction with quality selector.",
  category: "download",
  use: ".video <query>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {
  try {
    const input = q?.trim() || "";
    if (!input) return reply("⚙️ *SYSTEM:* Input required.");

    // --- PHASE 1: SEARCHING ---
    await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });

    let techHeader = `╔════════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────╢
│ ✞︎ *sᴛᴀᴛᴜs:* sᴄᴀɴɴɪɴɢ... 🎬
│ ✞︎ *ᴘʀᴏᴄᴇss:* ᴅᴀᴛᴀ_sᴄᴀɴ
│ ✞︎ *ʟᴏᴀᴅ:* [▬▬▬▭▭▭▭] 30%
╚════════════════╝`;

    const { key } = await conn.sendMessage(from, { text: techHeader }, { quoted: mek });

    let videoUrl = input;
    let videoMeta = { title: "Video File" };

    if (!input.startsWith("http")) {
      const search = await ytsearch(input);
      const v = search?.results?.[0];
      if (!v) return await conn.sendMessage(from, { text: "❌ **CORE ERROR:** NOT FOUND", edit: key });
      videoUrl = v.url;
      videoMeta = v;
    }

    // --- PHASE 2: QUALITY SELECTION ---
    let selectionMsg = `╔═══════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰
╟──────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${videoMeta.title.substring(0, 20)}...
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${videoMeta.timestamp || 'HD'}
╟───────────────╢
│  **sᴇʟᴇᴄᴛ ʀᴇsᴏʟᴜᴛɪᴏɴ:**
│
│  1 ➮ **𝟹𝟼𝟶ᴘ (ʟᴏᴡ ᴅᴀᴛᴀ)** 📉
│  2 ➮ **𝟽𝟸𝟶ᴘ (ʜɪɢʜ ᴅᴇғ)** 🎬
╟───────────────╢
│ 📥 **ʟᴏᴀᴅ:** [▬▬▬▬▬▬▬] 100%
╚═══════════════╝
> *Reply with 1 or 2*`;

    await conn.sendMessage(from, { text: selectionMsg, edit: key });

    // --- PHASE 3: INTERACTIVE LISTENER ---
    const listener = async (msg) => {
      const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
      const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

      if (isReply && msg.key.remoteJid === from && ['1', '2'].includes(body)) {
        conn.ev.off('messages.upsert', listener); // Stop listening

        const quality = body === '1' ? '360' : '720';
        
        // Update box to show "Downloading"
        await conn.sendMessage(from, { 
          text: selectionMsg.replace('sᴇʟᴇᴄᴛ ʀᴇsᴏʟᴜᴛɪᴏɴ:', `📥 **ᴘʀᴇᴘᴀʀɪɴɢ ${quality}ᴘ...**`), 
          edit: key 
        });

        const downloadLink = await fetchVideo(videoUrl, quality);

        // --- PHASE 4: TRANSMISSION ---
        await conn.sendMessage(from, {
          video: { url: downloadLink },
          mimetype: "video/mp4",
          caption: `🎬 *${videoMeta.title}*\n📡 *Quality:* ${quality}p\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
          contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363289379419860@newsletter',
              newsletterName: `『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 ${quality}𝐏 』`,
              serverMessageId: 143
            }
          }
        }, { quoted: quotedContact });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
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
