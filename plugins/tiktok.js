const axios = require("axios");
const { cmd } = require("../command");
const { ttdl } = require("ruhend-scraper");
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
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}
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
      serverMessageId: 145
    }
  }
};

// Store processed message IDs to avoid duplicates
const processed = new Set();

cmd({
  pattern: "tiktok",
  alias: ["tt", "tktk", "tik"],
  react: "🎵",
  desc: "Download TikTok videos (POP KID Style)",
  category: "download",
  use: ".tiktok <TikTok link>",
  filename: __filename
}, 

async (conn, mek, m, { from, q, sender }) => {
  newsletterConfig.contextInfo.mentionedJid = [sender];

  try {
    if (processed.has(mek.key.id)) return;
    processed.add(mek.key.id);
    setTimeout(() => processed.delete(mek.key.id), 300000);

    const url = q?.trim();
    if (!url)
      return conn.sendMessage(from, { text: "🎬 *Send a TikTok Link!*", ...newsletterConfig }, { quoted: quotedContact });

    // Validate link
    const valid = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i.test(url);
    if (!valid)
      return conn.sendMessage(from, { text: "❌ Not a valid TikTok URL!", ...newsletterConfig }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });

    // ─── 1) Send "Processing..." card ───
    await conn.sendMessage(from, {
      image: { url: "https://i.imgur.com/ViQXz0K.jpeg" },
      caption: `
🎥 *TIKTOK DOWNLOADER*
❤️💛💚💜🤎🔥✅
📥 Getting your video…
> Please wait…
`.trim(),
      ...newsletterConfig
    }, { quoted: quotedContact });

    // ─────────────────────────────────────────────
    //     2) MAIN API → SIPUTZX
    // ─────────────────────────────────────────────
    let videoUrl = null;
    let title = "TikTok Video";

    try {
      const api = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`;
      const res = await axios.get(api, { timeout: 15000 });

      if (res.data?.status && res.data?.data) {
        const d = res.data.data;

        title = d.metadata?.title || title;

        if (Array.isArray(d.urls)) videoUrl = d.urls[0];
        else videoUrl = d.url || d.download_url || d.video_url;
      }
    } catch (e) {
      console.log("Siputzx failed → fallback");
    }

    // ─────────────────────────────────────────────
    //     3) FALLBACK → Ruhend ttdl
    // ─────────────────────────────────────────────
    if (!videoUrl) {
      try {
        const dl = await ttdl(url);
        if (dl?.data?.length) {
          const media = dl.data.find(x => x.type === "video");
          if (media) videoUrl = media.url;
        }
      } catch (e) {}
    }

    if (!videoUrl)
      return conn.sendMessage(from, { text: "❌ *Download failed.* Try another link.", ...newsletterConfig }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "⬆️", key: mek.key } });

    // ─── Final send ───
    await conn.sendMessage(from, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: `
🎬 *POP KID TIKTOK DL*
❤️💛💚💜🤎🔥✅
📝 Title: ${title}
> _POP KIDS MEDIA_
`.trim(),
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("TIKTOK ERROR:", err);
    await conn.sendMessage(from, { text: "⚠️ Error downloading TikTok.", ...newsletterConfig }, { quoted: quotedContact });
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
