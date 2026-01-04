const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok videos",
    category: "download",
    react: "📥",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a TikTok URL.\n\n*Example:* .tiktok https://vm.tiktok.com/xxxxxx");

        // React with loading
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Request
        const apiUrl = `https://apis.davidcyriltech.my.id/download/tiktok?url=${q}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result) {
            return reply("❌ Failed to fetch video. Make sure the link is valid.");
        }

        const videoData = data.result;
        
        // Send Video (No Watermark)
        await conn.sendMessage(from, {
            video: { url: videoData.video },
            caption: `✅ *TikTok Downloaded Successfully*\n\n📌 *Title:* ${videoData.title}\n👤 *Author:* ${videoData.author}\n\n*ᴘᴏᴘᴋɪᴅ ᴀɪ*`,
        }, { quoted: mek });

        // Final success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error(err);
        reply("❌ An error occurred while downloading the video.");
    }
});
