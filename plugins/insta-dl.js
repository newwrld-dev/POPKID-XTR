import axios from 'axios';
import config from '../config.cjs';

const instaDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command triggers
  if (cmd !== "instagram" && cmd !== "ig" && cmd !== "igdl") return;

  try {
    const args = body.slice(prefix.length + cmd.length).trim();

    if (!args) {
      return m.reply("📸 *Usage:* .ig [instagram-url]");
    }

    await m.reply("_⏳ Fetching Instagram media..._");

    // API Endpoint for Instagram
    const apiUrl = `https://api.yupra.my.id/api/downloader/Instagram?url=${encodeURIComponent(args)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate response status and existence of results
    if (!res || res.status !== 200 || !res.result?.medias) {
      return m.reply("❌ *Error:* Could not retrieve media. Please ensure the link is public.");
    }

    const medias = res.result.medias; //
    
    // Loop through found media and send
    for (const item of medias) {
      const mediaUrl = item.url; //
      const type = item.type; //

      if (type === "video") {
        await gss.sendMessage(m.from, {
          video: { url: mediaUrl },
          caption: `✅ *Instagram Video Downloaded*`,
          mimetype: "video/mp4"
        }, { quoted: m });
      } else if (type === "image") {
        await gss.sendMessage(m.from, {
          image: { url: mediaUrl },
          caption: `✅ *Instagram Image Downloaded*`
        }, { quoted: m });
      }
    }

  } catch (error) {
    console.error("IG CMD ERROR:", error);
    m.reply("⚠️ *System Error:* Instagram server is currently unreachable.");
  }
};

export default instaDownload;
