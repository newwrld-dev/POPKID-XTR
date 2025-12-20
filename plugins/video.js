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

// API CONFIGS
const izumi = { baseURL: "https://izumiiiiiiii.dpdns.org" };
const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
};

async function tryRequest(getter, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await getter(); } catch (err) { lastError = err; await new Promise(r => setTimeout(r, 1000)); }
  }
  throw lastError;
}

async function getIzumiVideo(url) {
  const api = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(url)}&format=720`;
  const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
  if (res?.data?.result?.download) return res.data.result;
  throw new Error("Izumi Error");
}

async function getOkatsu(url) {
  const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`;
  const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
  if (res?.data?.result?.mp4) return { download: res.data.result.mp4, title: res.data.result.title };
  throw new Error("Okatsu Error");
}

// ───────────────────────────────────────────────
//        ADVANCED VIDEO COMMAND
// ───────────────────────────────────────────────
cmd({
  pattern: "video",
  alias: ["ytvideo", "mp4"],
  react: "🎬",
  desc: "High-speed video extraction.",
  category: "download",
  use: ".video <query/link>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {
  try {
    const input = q?.trim() || "";
    if (!input) return reply("⚙️ *SYSTEM:* Input required.");

    // --- PHASE 1: INITIAL SCAN ---
    await conn.sendMessage(from, { react: { text: "📡", key: mek.key } });

    let techHeader = `╔══════════════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────────────╢
│ ✞︎ **sᴛᴀᴛᴜs:** sᴇᴀʀᴄʜɪɴɢ... 🎬
│ ✞︎ **ᴘʀᴏᴄᴇss:** ᴅᴀᴛᴀ_sᴄᴀɴ
│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▭▭▭▭] 30%
╚══════════════════════╝`;

    const { key } = await conn.sendMessage(from, { text: techHeader }, { quoted: mek });

    let videoUrl = input;
    let videoMeta = { title: "Video File" };

    if (!input.startsWith("http")) {
      const search = await ytsearch(input);
      const v = search?.results?.[0];
      if (!v) return await conn.sendMessage(from, { text: "❌ **CORE ERROR:** NO RESULTS FOUND", edit: key });

      videoUrl = v.url;
      videoMeta = v;
    }

    // --- PHASE 2: UPDATE BOX ---
    let downloadHeader = `╔══════════════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${videoMeta.title.substring(0, 20)}...
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${videoMeta.timestamp || 'HD'}
│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▬▬▬▬] 100%
╟──────────────────────╢
│ 📥 **sᴛᴀᴛᴜs:** ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...
╚══════════════════════╝`;

    await conn.sendMessage(from, { text: downloadHeader, edit: key });

    // Download video (Izumi → Okatsu fallback)
    let video;
    try {
      video = await getIzumiVideo(videoUrl);
    } catch (e) {
      video = await getOkatsu(videoUrl);
    }

    // --- PHASE 3: TRANSMISSION ---
    await conn.sendMessage(from, {
      video: { url: video.download },
      mimetype: "video/mp4",
      fileName: `${video.title || "POPKID"}.mp4`,
      caption: `🎬 *${video.title || videoMeta.title}*\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: '『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎 』',
          serverMessageId: 143
        }
      }
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(from, { text: "⚠️ **SYSTEM FATAL ERROR**", edit: key });
  }
});
