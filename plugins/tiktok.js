import axios from "axios";
import { ttdl } from "ruhend-scraper";
import config from "../config.cjs";

const processed = new Set();

const tiktok = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";

  // Handle command check
  const args = body.trim().split(/\s+/);
  const cmd = args[0].toLowerCase();
  if (![prefix + "tiktok", prefix + "tt"].includes(cmd)) return;

  try {
    // Prevent spamming the same request
    if (processed.has(m.key.id)) return;
    processed.add(m.key.id);
    setTimeout(() => processed.delete(m.key.id), 30000); // 30s cooldown

    // Improved Regex to catch various TikTok link formats
    const urlMatch = body.match(/https?:\/\/(?:vm|vt|www)\.tiktok\.com\/\S+/i);

    if (!urlMatch) {
      return m.reply("❌ Please send a valid TikTok link.\n\nExample:\n.tiktok https://vt.tiktok.com/xxxx");
    }

    const url = urlMatch[0].split('?')[0]; // Clean the URL of tracking params

    await gss.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

    let videoUrl = null;
    let title = "TikTok Video";

    /* ================= ATTEMPT 1: SIPUTZX API ================= */
    try {
      const { data } = await axios.get(`https://api.siputzx.my.id/api/d/tiktok?url=${url}`);
      
      if (data.status && data.data) {
        const d = data.data;
        title = d.title || "No Title";
        // Check for common video field names in Siputzx response
        videoUrl = d.video_url || d.nowm || d.no_watermark || (d.urls && d.urls[0]);
      }
    } catch (e) {
      console.log("Siputzx API error:", e.message);
    }

    /* ================= ATTEMPT 2: RUHEND FALLBACK ================= */
    if (!videoUrl) {
      try {
        const res = await ttdl(url);
        if (res && res.data) {
          // Find the video without watermark
          const videoData = res.data.find(v => v.type === "nowatermark" || v.type === "video");
          videoUrl = videoData?.url;
        }
      } catch (e) {
        console.log("Ruhend-scraper error:", e.message);
      }
    }

    /* ================= FINAL DELIVERY ================= */
    if (videoUrl) {
      await gss.sendMessage(m.from, {
        video: { url: videoUrl },
        caption: `✅ *Success*\n📝 *Title:* ${title}`,
        mimetype: "video/mp4"
      }, { quoted: m });
      
      return await gss.sendMessage(m.from, { react: { text: "✅", key: m.key } });
    } else {
      throw new Error("Could not extract video URL");
    }

  } catch (err) {
    console.error("TIKTOK CMD ERROR:", err);
    m.reply("❌ An error occurred while processing your request. The video might be private or the server is down.");
    await gss.sendMessage(m.from, { react: { text: "❌", key: m.key } });
  }
};

export default tiktok;
