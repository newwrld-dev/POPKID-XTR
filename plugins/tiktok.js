import axios from 'axios';
import config from '../config.cjs';

const tiktokDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "tiktok" && cmd !== "tt") return;

  try {
    const args = body.slice(prefix.length + cmd.length).trim();

    if (!args) {
      return m.reply("📱 *Usage:* .tiktok [tiktok-url]");
    }

    await m.reply("_⏳ Processing TikTok video, please wait..._");

    // Fetch data from the TikTok API
    const apiUrl = `https://api.yupra.my.id/api/downloader/tiktok?url=${encodeURIComponent(args)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Check if the request was successful
    if (!res || res.status !== 200 || !res.result) {
      return m.reply("❌ *Error:* Could not fetch the TikTok video. Make sure the link is valid.");
    }

    const videoData = res.result;
    const title = videoData.title || "TikTok Video";
    const author = videoData.author?.nickname || "Unknown Creator";

    // Find the HD No-Watermark URL in the data array
    const hdVideo = videoData.data.find(v => v.type === "nowatermark_hd") || videoData.data.find(v => v.type === "nowatermark");

    if (!hdVideo) {
      return m.reply("❌ *Error:* No downloadable video link found.");
    }

    // Send the video with a clean caption
    await gss.sendMessage(m.from, {
      video: { url: hdVideo.url },
      caption: `✅ *TikTok Downloaded*\n\n📝 *Title:* ${title}\n👤 *Creator:* ${author}\n⏱️ *Duration:* ${videoData.duration}`,
      mimetype: "video/mp4"
    }, { quoted: m });

  } catch (error) {
    console.error("TIKTOK CMD ERROR:", error);
    m.reply("⚠️ *System Error:* The TikTok server is currently unresponsive.");
  }
};

export default tiktokDownload;
