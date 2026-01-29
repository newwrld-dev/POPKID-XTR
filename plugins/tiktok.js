import axios from "axios";
import { ttdl } from "ruhend-scraper";
import config from "../config.cjs";

const processed = new Set();

const tiktok = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";

  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
    : "";

  if (!["tiktok", "tt"].includes(cmd)) return;

  try {
    if (processed.has(m.key.id)) return;
    processed.add(m.key.id);
    setTimeout(() => processed.delete(m.key.id), 300000);

    /* ================= EXTRACT URL SAFELY ================= */
    const urlMatch = body.match(
      /(https?:\/\/(?:www\.)?(?:vt|vm|tiktok)\.com\/[^\s]+)/i
    );

    if (!urlMatch) {
      return m.reply(
        "❌ Please send a valid TikTok link.\n\nExample:\n.tiktok https://vt.tiktok.com/xxxx"
      );
    }

    const url = urlMatch[1].trim();

    await gss.sendMessage(m.from, {
      react: { text: "⏳", key: m.key },
    });

    let videoUrl = null;
    let title = "TikTok Video";

    /* ================= SIPUTZX API ================= */
    try {
      const api = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(
        url
      )}`;

      const res = await axios.get(api, { timeout: 15000 });

      if (res.data?.status && res.data?.data) {
        const d = res.data.data;
        title = d.metadata?.title || title;

        if (Array.isArray(d.urls) && d.urls.length > 0) {
          videoUrl = d.urls[0];
        } else {
          videoUrl = d.video_url || d.download_url || d.url || null;
        }
      }
    } catch (e) {
      console.log("Siputzx failed:", e.message);
    }

    /* ================= FALLBACK: RUHEND ================= */
    if (!videoUrl) {
      try {
        const data = await ttdl(url);
        const media = data?.data?.find(v => v.type === "video");

        if (media?.url) {
          return await gss.sendMessage(
            m.from,
            {
              video: { url: media.url },
              mimetype: "video/mp4",
              caption: "🎥 TikTok Video",
            },
            { quoted: m }
          );
        }
      } catch (e) {
        console.log("ttdl failed:", e.message);
      }
    }

    if (!videoUrl) {
      return m.reply("❌ Failed to download TikTok video.");
    }

    /* ================= BUFFER DOWNLOAD ================= */
    try {
      const res = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.tiktok.com/",
        },
      });

      const buffer = Buffer.from(res.data);

      if (!buffer || buffer.length < 100000) {
        throw new Error("Invalid buffer");
      }

      await gss.sendMessage(
        m.from,
        {
          video: buffer,
          mimetype: "video/mp4",
          caption: `🎥 TikTok\n📝 ${title}`,
        },
        { quoted: m }
      );
    } catch {
      await gss.sendMessage(
        m.from,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption: `🎥 TikTok\n📝 ${title}`,
        },
        { quoted: m }
      );
    }
  } catch (err) {
    console.error("TIKTOK ERROR:", err);
    m.reply("❌ Error while processing TikTok.");
  }
};

export default tiktok;
