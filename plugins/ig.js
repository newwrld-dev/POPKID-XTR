const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "ig",
    alias: ["insta", "instagram"],
    desc: "Download Instagram Reels/Videos",
    category: "download",
    react: "📸",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("👉 *Please provide a valid Instagram link.*");

      // Visual feedback
      await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

      const apiUrl = `https://api.srihub.store/download/instadl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(q)}`;
      
      const response = await axios.get(apiUrl);
      const result = response.data;

      // Logic to check if the API returned data correctly
      if (!result.status || !result.data || !result.data.url) {
        return reply("❌ *Failed to fetch media. Make sure the link is public.*");
      }

      const downloadUrl = result.data.url;

      // Sending the video with Popkid AI styling
      await conn.sendMessage(from, {
        video: { url: downloadUrl },
        caption: `✨ *IG Downloader by Popkid AI*\n\n✅ *Success!*`,
      }, { quoted: m });

      await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
      console.error(e);
      reply("⚠️ *Error:* " + e.message);
    }
  }
);
