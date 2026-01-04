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

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // FIX: Encode the URL to handle special characters like '&' or '/'
        const encodedUrl = encodeURIComponent(q);
        const apiUrl = `https://apis.davidcyriltech.my.id/facebook?url=${encodedUrl}`;
        
        const response = await axios.get(apiUrl);
        const data = response.data;

        // FIX: Check if 'data' and 'data.result' actually exist before reading them
        if (!data || !data.status || !data.result) {
            return reply("❌ Video not found. The link might be private or invalid.");
        }

        // Auto-select HD if available, otherwise SD
        const videoUrl = data.result.hd || data.result.sd;
        
        if (!videoUrl) {
            return reply("❌ Could not find a downloadable video link.");
        }

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            caption: `✅ *ᴘᴏᴘᴋɪᴅ ᴀɪ ғʙ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Title:* ${data.result.title || "Facebook Video"}\n\n*Created by Popkid from Kenya*`,
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("FB Downloader Error:", err.message);
        // This stops the 'toString' error from showing to the user
        reply("❌ System Error: " + (err.response?.data?.message || "API is currently offline."));
    }
});
