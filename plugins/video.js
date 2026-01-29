import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const videoDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command name for this file
  if (cmd !== "video") return;

  try {
    const text = body.slice(prefix.length + cmd.length).trim();

    if (!text) {
      return m.reply("🎬 *Usage:* .video [song/video name]");
    }

    // Search YouTube
    const search = await yts(text);
    if (!search.videos || search.videos.length === 0) {
      return m.reply("🚫 *No results found.*");
    }

    const video = search.videos[0];
    const urlYt = video.url;

    // Stylish Status Message
    const infoMsg = `🎥 *WATCHING:* ${video.title}\n` +
                    `⏱️ *DURATION:* ${video.timestamp}\n` +
                    `👁️ *VIEWS:* ${video.views.toLocaleString()}\n\n` +
                    `_⚡ Preparing your video file..._`;

    await m.reply(infoMsg);

    // Fetch MP4 from the new API
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp4?url=${encodeURIComponent(urlYt)}`;
    const response = await axios.get(apiUrl);
    const result = response.data;

    // Validate the API response structure
    if (!result || !result.success || !result.data?.download_url) {
      return m.reply("❌ *Error:* The video server is currently busy. Please try again later.");
    }

    const videoUrl = result.data.download_url; //
    const title = result.data.title || video.title; //

    // Send the actual Video file
    await gss.sendMessage(m.from, {
      video: { url: videoUrl },
      caption: `✅ *Download Complete:* ${title}`,
      mimetype: "video/mp4",
      fileName: `${title}.mp4`
    }, { quoted: m });

  } catch (error) {
    console.error("VIDEO CMD ERROR:", error);
    m.reply("⚠️ *System Error:* Could not process video download.");
  }
};

export default videoDownload;
