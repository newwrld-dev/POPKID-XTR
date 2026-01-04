const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "facebook",
    alias: ["fb", "fbdl"],
    desc: "Download Facebook videos",
    category: "download",
    react: "🔵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Facebook video URL.\n\n*Example:* .facebook https://www.facebook.com/share/v/xxxx");

        // React with loading
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Request to David Cyril's API
        const apiUrl = `https://apis.davidcyriltech.my.id/facebook3?url=${q}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Check for success
        if (!data.status || !data.result) {
            return reply("❌ Failed to fetch video. The link might be private or invalid.");
        }

        const videoUrl = data.result.hd || data.result.sd; // Prioritize HD quality
        const videoTitle = data.result.title || "Facebook Video";

        // Send the Video
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `✅ *Facebook Video Downloaded*\n\n📌 *Title:* ${videoTitle}\n\n*ᴘᴏᴘᴋɪᴅ ᴀɪ*`,
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Error downloading Facebook video. Please try again later.");
    }
});
