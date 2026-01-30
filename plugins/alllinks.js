import axios from 'axios';
import config from '../config.cjs';

const aioDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Set the command trigger
  if (cmd !== "links" && cmd !== "alldl") return;

  try {
    const url = body.slice(prefix.length + cmd.length).trim();

    if (!url) {
      return m.reply("🌐 *Usage:* .aio [social media link]\n*Works for:* Instagram, Facebook, Threads, etc.");
    }

    // Set "Typing" status for a premium feel
    await gss.sendPresenceUpdate('composing', m.from);
    await m.reply("_⏳ Detecting and fetching media, please wait..._");

    // Fetch from the All-in-One API
    const apiUrl = `https://api-faa.my.id/faa/aio?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate the response structure
    if (!res || res.status !== true || !res.result?.download_url) {
      return m.reply("❌ *Error:* Could not process this link. Please ensure it is a public post.");
    }

    const data = res.result; //
    const downloadLink = data.download_url; //
    const title = data.title || "Social Media Download";

    // Inform the user of success
    const caption = `✅ *Success!*\n📌 *Source:* ${title.length > 50 ? title.substring(0, 50) + "..." : title}\n\n_🚀 Sending your file now..._`;

    // Attempt to send as video first, as most social links are videos/reels
    await gss.sendMessage(m.from, {
      video: { url: downloadLink },
      caption: caption,
      mimetype: "video/mp4"
    }, { quoted: m });

  } catch (error) {
    console.error("AIO DOWNLOAD ERROR:", error);
    m.reply("⚠️ *System Error:* The downloader is currently unavailable.");
  }
};

export default aioDownload;
