import axios from 'axios';
import config from '../config.cjs';

const fbDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command triggers
  if (cmd !== "facebook" && cmd !== "fb" && cmd !== "fbdl") return;

  try {
    const args = body.slice(prefix.length + cmd.length).trim();

    if (!args) {
      return m.reply("📘 *Usage:* .fb [facebook-url]");
    }

    await m.reply("_⏳ Fetching Facebook media..._");

    // API Endpoint for Facebook
    const apiUrl = `https://api-faa.my.id/faa/fbdownload?url=${encodeURIComponent(args)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate response based on your screenshot structure
    if (!res || res.status !== true || !res.result) {
      return m.reply("❌ *Error:* Could not retrieve video. Please ensure the link is public.");
    }

    const data = res.result;
    const videoUrl = data.video_hd || data.video_sd; // Use HD if available, otherwise SD
    const captionText = data.info?.title || "Facebook Video";

    if (videoUrl) {
      await gss.sendMessage(m.from, {
        video: { url: videoUrl },
        caption: `✅ *Facebook Video Downloaded*\n\n📌 *Title:* ${captionText}`,
        mimetype: "video/mp4"
      }, { quoted: m });
    } else {
      m.reply("❌ *Error:* No downloadable video found.");
    }

  } catch (error) {
    console.error("FB CMD ERROR:", error);
    m.reply("⚠️ *System Error:* Facebook server is currently unreachable.");
  }
};

export default fbDownload;
