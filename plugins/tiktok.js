import axios from "axios";
import config from "../config.cjs";

const tiktok = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";

  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  const text = body.slice(prefix.length + cmd.length).trim();

  if (cmd === "tiktok" || cmd === "tt" || cmd === "ttwm") {
    if (!text) {
      return m.reply(
        "🍁 Please provide a TikTok link\n\nExample:\n.tiktok https://vt.tiktok.com/xxxx"
      );
    }

    try {
      await m.React("🕘");

      const apiKey = "3744ab07f2821b1ba7208a6a";
      const apiUrl = `https://api.lolhuman.xyz/api/tiktokwm?apikey=${apiKey}&url=${encodeURIComponent(text)}`;

      const res = await axios.get(apiUrl);
      const data = res.data;

      if (!data || data.status !== 200 || !data.result?.link) {
        await m.React("❌");
        return m.reply("❌ Failed to fetch TikTok video.");
      }

      const videoUrl = data.result.link;
      const title = data.result.title || "TikTok Video";

      // 🔥 SEND VIDEO DIRECTLY (NO DOWNLOAD)
      await gss.sendMessage(
        m.from,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          caption: `🎵 *TikTok Downloader*\n\n${title}\n\n> © Popkid MD`,
        },
        { quoted: m }
      );

      await m.React("✅");

    } catch (err) {
      console.error("TikTok Error:", err);
      await m.React("❌");
      m.reply("❌ An error occurred while processing your request.");
    }
  }
};

export default tiktok;
