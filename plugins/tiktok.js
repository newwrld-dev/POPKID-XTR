import axios from "axios";
import { ttdl } from "ruhend-scraper";
import config from "../config.cjs";

const processedTikTok = new Set();

const tiktok = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "tiktok" && cmd !== "tt") return;

  try {
    // Prevent duplicate processing
    if (processedTikTok.has(m.key.id)) return;
    processedTikTok.add(m.key.id);
    setTimeout(() => processedTikTok.delete(m.key.id), 5 * 60 * 1000);

    const args = body.trim().split(/\s+/);
    const url = args.slice(1).join(" ").trim();

    if (!url) {
      return m.reply(
        "❌ Please provide a TikTok link.\n\nExample:\n.tiktok https://vt.tiktok.com/xxxx"
      );
    }

    // Validate TikTok URL
    const tiktokRegex = /https?:\/\/(www\.)?(vt|vm|tiktok)\.com\/.+/i;
    if (!tiktokRegex.test(url)) {
      return m.reply("❌ Invalid TikTok link.");
    }

    // Reaction
    await gss.sendMessage(m.from, {
      react: { text: "⏳", key: m.key },
    });

    let videoUrl = null;
    let title = null;

    /* ================= SIPUTZX API ================= */
    try {
      const api = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(
        url
      )}`;

      const res = await axios.get(api, { timeout: 15000 });

      if (res.data?.status && res.data?.data) {
        const data = res.data.data;
        title = data.metadata?.title || "TikTok Video";

        if (Array.isArray(data.urls) && data.urls.length > 0) {
          videoUrl = data.urls[0];
        } else {
          videoUrl =
            data.video_url ||
            data.download_url ||
            data.url ||
            null;
        }
      }
    } catch (e) {
      console.error("Siputzx failed:", e.message);
    }

    /* ================= RUHEND SCRAPER FALLBACK ================= */
    if (!videoUrl) {
      try {
        const data = await ttdl(url);
        if (data?.data?.length) {
          for (const media of data.data) {
            if (media.type === "video") {
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
          }
        }
      } catch (e) {
        console.error("ttdl fallback failed:", e.message);
      }
    }

    if (!videoUrl) {
      return m.reply("❌ Failed to download TikTok video.");
    }

    /* ================= BUFFER DOWNLOAD ================= */
    try {
      const videoRes = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024,
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.tiktok.com/",
        },
      });

      const buffer = Buffer.from(videoRes.data);

      if (!buffer || buffer.length < 500000) {
        throw new Error("Invalid video buffer");
      }

      await gss.sendMessage(
        m.from,
        {
          video: buffer,
          mimetype: "video/mp4",
          caption: `🎥 TikTok Video\n📝 ${title}`,
        },
        { quoted: m }
      );
    } catch (e) {
      // Fallback: send URL
      await gss.sendMessage(
        m.from,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption: `🎥 TikTok Video\n📝 ${title}`,
        },
        { quoted: m }
      );
    }
  } catch (err) {
    console.error("TIKTOK CMD ERROR:", err);
    m.reply("❌ Error processing TikTok download.");
  }
};

export default tiktok;
