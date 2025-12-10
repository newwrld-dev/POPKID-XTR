const axios = require("axios");
const { cmd } = require("../command");
const { ytsearch } = require("@dark-yasiya/yt-dl.js");
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
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

// Newsletter style
const newsletterConfig = {
  contextInfo: {
    mentionedJid: [],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363289379419860@newsletter',
      newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃',
      serverMessageId: 143
    }
  }
};

// API CONFIGS
const izumi = {
  baseURL: "https://izumiiiiiiii.dpdns.org"
};

const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json, text/plain, */*'
  }
};

// Retry helper
async function tryRequest(getter, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await getter();
    } catch (err) {
      lastError = err;
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }
  throw lastError;
}

// Izumi video downloader
async function getIzumiVideo(url) {
  const api = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(url)}&format=720`;
  const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
  if (res?.data?.result?.download) return res.data.result;
  throw new Error("Izumi no download");
}

// Okatsu backup
async function getOkatsu(url) {
  const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`;
  const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
  if (res?.data?.result?.mp4)
    return {
      download: res.data.result.mp4,
      title: res.data.result.title
    };
  throw new Error("Okatsu no mp4");
}


// ───────────────────────────────────────────────
//        VIDEO COMMAND (POP KIDS STYLE)
// ───────────────────────────────────────────────
cmd({
  pattern: "video",
  alias: ["ytvideo", "mp4", "playvideo"],
  react: "🎬",
  desc: "Download YouTube videos using Izumi & Okatsu API",
  category: "download",
  use: ".video <song or link>",
  filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {

  newsletterConfig.contextInfo.mentionedJid = [sender];

  try {
    const input = q?.trim() || "";
    if (!input) return reply("🎬 What video should I fetch?");

    await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });
    await conn.sendMessage(from, { text: `🎬 Searching for: *${input}*`, ...newsletterConfig }, { quoted: quotedContact });

    // Determine if the input is a link
    let videoUrl = input;
    let videoMeta = {};

    if (!input.startsWith("http")) {
      // Search YouTube
      const search = await ytsearch(input);
      const v = search?.results?.[0];
      if (!v) return reply("❌ No results found!");

      videoUrl = v.url;
      videoMeta = v;

      // Send searching thumbnail card
      await conn.sendMessage(from, {
        image: { url: v.thumbnail },
        caption: `
🎥 *POP KID VIDEO DOWNLOADER*
💛🤎💜💚💛💞✅
📝 *Title:* ${v.title}
⏱ *Duration:* ${v.timestamp}
👤 *Author:* ${v.author?.name}
> 📥 Preparing download...
`.trim(),
        ...newsletterConfig
      }, { quoted: quotedContact });
    }

    // Download video (Izumi → Okatsu fallback)
    let video;
    try {
      video = await getIzumiVideo(videoUrl);
    } catch (e) {
      video = await getOkatsu(videoUrl);
    }

    // Final sending
    await conn.sendMessage(from, {
      video: { url: video.download },
      mimetype: "video/mp4",
      fileName: `${video.title || videoMeta.title || "video"}.mp4`,
      caption: `🎬 *${video.title || videoMeta.title}*\n\n> _POP KIDS MEDIA_`,
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("[VIDEO ERROR]:", err);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply("⚠️ Failed to download video.");
  }
});
