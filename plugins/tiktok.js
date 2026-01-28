import axios from "axios";
import config from "../config.cjs";

const tiktok = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command names
  if (cmd === "tiktok" || cmd === "tt") {
    try {
      // 1. Get text after command
      const text = body.slice(prefix.length + cmd.length).trim();

      if (!text) {
        return m.reply("🍁 Please provide a TikTok link!\n\nExample:\n.tiktok https://vt.tiktok.com/xxxx");
      }

      // 2. Call Sawit TikTok API
      const res = await axios.get("https://api.sawit.biz.id/api/tiktok", {
        params: {
          url: text,
          type: "video"
        }
      });

      const data = res.data;

      if (!data || !data.result) {
        return m.reply("❌ Failed to fetch TikTok video.");
      }

      const videoUrl = data.result.video || data.result.nowm;
      const caption =
        `🎵 *TikTok Downloader*\n\n` +
        `👤 Author: ${data.result.author || "Unknown"}\n` +
        `❤️ Likes: ${data.result.like || "-"}\n` +
        `💬 Comments: ${data.result.comment || "-"}\n` +
        `🔁 Shares: ${data.result.share || "-"}\n`;

      // 3. Send video
      await gss.sendMessage(m.from, {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        caption
      }, { quoted: m });

    } catch (error) {
      console.error("TikTok Error:", error);
      m.reply("❌ Error downloading TikTok:\n" + error.message);
    }
  }
};

export default tiktok;
