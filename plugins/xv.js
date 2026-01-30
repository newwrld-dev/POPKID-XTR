import axios from 'axios';
import config from '../config.cjs';

const xvideosDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "xvideos" && cmd !== "xvdl") return;

  try {
    const url = body.slice(prefix.length + cmd.length).trim();

    if (!url) {
      return m.reply("🔞 *Usage:* .xvideos [url]");
    }

    // Set "Typing" status for a premium feel
    await gss.sendPresenceUpdate('composing', m.from);
    await m.reply("_⏳ Fetching video content, please wait..._");

    // Fetch from GiftedTech API
    const apiUrl = `https://api.giftedtech.co.ke/api/download/xvideosdl?apikey=gifted&url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate the response
    if (!res || res.status !== 200 || !res.result?.url) {
      return m.reply("❌ *Error:* Failed to fetch the video. Check if the link is valid.");
    }

    const video = res.result; //
    const caption = `🔞 *VIDEO DOWNLOADED*\n\n` +
                    `📝 *Title:* ${video.title}\n` +
                    `👁️ *Views:* ${video.views}\n` +
                    `👍 *Votes:* ${video.votes}\n\n` +
                    `_🚀 Sending file..._`;

    // Send the video file
    await gss.sendMessage(m.from, {
      video: { url: video.url },
      caption: caption,
      mimetype: "video/mp4"
    }, { quoted: m });

  } catch (error) {
    console.error("XVIDEOS ERROR:", error);
    m.reply("⚠️ *System Error:* The downloader is currently unavailable.");
  }
};

export default xvideosDownload;
