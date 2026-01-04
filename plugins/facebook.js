const axios = require('axios');
const { cmd } = require('../command');

// Temporary storage for user choices
let fbCache = {};

cmd({
    pattern: "facebook",
    alias: ["fb", "fbdl"],
    desc: "Download Facebook videos with quality choice",
    category: "download",
    react: "🔵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a Facebook URL.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const apiUrl = `https://apis.davidcyriltech.my.id/facebook?url=${q}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status || !data.result) return reply("❌ Video not found.");

        // Save links in cache for this specific user/chat
        fbCache[from] = {
            hd: data.result.hd,
            sd: data.result.sd,
            title: data.result.title || "Facebook Video"
        };

        const menu = `🎬 *ᴘᴏᴘᴋɪᴅ ᴀɪ ғʙ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                     `📌 *Title:* ${fbCache[from].title}\n\n` +
                     `Please reply with a number:\n` +
                     `1️⃣ *High Quality (HD)*\n` +
                     `2️⃣ *Standard Quality (SD)*\n\n` +
                     `_Example: Reply with 1_`;

        return reply(menu);

    } catch (err) {
        reply("❌ Error fetching video.");
    }
});

// Listener for the user's choice (1 or 2)
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, isQuoted }) => {
    // Only trigger if we have a pending FB download in this chat
    if (fbCache[from] && (body === "1" || body === "2")) {
        try {
            const selected = body === "1" ? fbCache[from].hd : fbCache[from].sd;
            const quality = body === "1" ? "HD" : "SD";

            if (!selected) return reply(`❌ ${quality} version is not available for this video.`);

            await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

            await conn.sendMessage(from, {
                video: { url: selected },
                caption: `✅ *Downloaded in ${quality}*\n\n*ᴘᴏᴘᴋɪᴅ ❤️*`
            }, { quoted: mek });

            // Clear cache after sending
            delete fbCache[from];

        } catch (err) {
            reply("❌ Error sending video.");
        }
    }
});
