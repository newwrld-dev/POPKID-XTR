const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "facebook",
    alias: ["fb", "fbdl"],
    desc: "Direct Facebook video downloader",
    category: "download",
    react: "🔵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Facebook video URL.");

        // React with loading
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Fetching data from the API
        const apiUrl = `https://apis.davidcyriltech.my.id/facebook?url=${q}`;
        const { data } = await axios.get(apiUrl);

        if (!data.status || !data.result) {
            return reply("❌ Failed to fetch video. The link may be private or invalid.");
        }

        // Auto-select HD if available, otherwise SD
        const videoUrl = data.result.hd || data.result.sd;

        // Send the video directly
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `✅ *ᴘᴏᴘᴋɪᴅ ᴀɪ ғʙ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Title:* ${data.result.title || "Facebook Video"}\n\n*Created by Popkid from Kenya*`,
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        reply("❌ Error: " + err.message);
    }
});
