const { cmd } = require('../command');

cmd({
    pattern: "uptime",
    desc: "Check how long the bot has been active",
    category: "main",
    react: "⏳",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // Get uptime in seconds
        const uptimeSeconds = process.uptime();
        
        // Convert seconds to a readable format
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        const uptimeString = `⏳ *ᴘᴏᴘᴋɪᴅ ᴀɪ ᴜᴘᴛɪᴍᴇ:* \n\n` +
                             `*${hours}h ${minutes}m ${seconds}s*`;

        return reply(uptimeString);
    } catch (e) {
        console.log(e);
        reply("❌ Error fetching uptime.");
    }
});
