const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
    pattern: "video",
    alias: ["mp4", "v"],
    react: "🎥",
    desc: "Download video from YouTube with tech interface.",
    category: "download",
    use: ".video2 <query or url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a video name or URL.");

        // --- PHASE 1: INITIAL SCAN ---
        let techMsg = `╔═══════════════╗
  ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰
╟────────────╢
│ ✞︎ **sᴛᴀᴛᴜs:** sᴄᴀɴɴɪɴɢ... 🎥
│ ✞︎ **ᴘʀᴏᴄᴇss:** ᴅᴀᴛᴀ_ʟᴏᴏᴋᴜᴘ
│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▭▭▭▭] 30%
╚═══════════════╝`;

        const { key } = await conn.sendMessage(from, { text: techMsg }, { quoted: mek });

        let videoUrl, title, timestamp;
        
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoId = q.split(/[=/]/).pop();
            const videoInfo = await yts({ videoId });
            title = videoInfo.title;
            timestamp = videoInfo.timestamp;
        } else {
            const search = await yts(q);
            if (!search.videos.length) return await conn.sendMessage(from, { text: "❌ **CORE ERROR:** NOT FOUND", edit: key });
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            timestamp = search.videos[0].timestamp;
        }

        // --- PHASE 2: DOWNLOADING STATUS ---
        let downloadMsg = `╔═══════════════╗
  ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰
╟────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${title.substring(0, 20)}...
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${timestamp}
│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▬▬▬▬] 100%
╟────────────╢
│ 📥 **sᴛᴀᴛᴜs:** ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...
╚═══════════════╝`;

        await conn.sendMessage(from, { text: downloadMsg, edit: key });

        // Fetching Video Data
        const apiUrl = `https://apis.davidcyriltech.my.id/download/ytmp4?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success || !data.result?.download_url) {
            return await conn.sendMessage(from, { text: "❌ **FATAL ERROR:** DOWNLOAD FAILED", edit: key });
        }

        // --- PHASE 3: TRANSMISSION ---
        await conn.sendMessage(from, {
            video: { url: data.result.download_url },
            mimetype: 'video/mp4',
            caption: `🎬 *${title}*\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363289379419860@newsletter',
                    newsletterName: '『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝐈𝐃𝐄𝐎 』',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** ${error.message}`);
    }
});
