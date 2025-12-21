const config = require('../config');
const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "x",
    alias: ["xvideo", "porn", "dlx"],
    react: "🍾",
    desc: "Download videos with tech interface.",
    category: "download",
    use: ".x <query or url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a search query or URL.");

        // --- PHASE 1: INITIAL SCAN ---
        let techMsg = `╔═══════════════╗\n  ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰\n╟────────────╢\n│ ✞︎ **sᴛᴀᴛᴜs:** sᴄᴀɴɴɪɴɢ... 🎥\n│ ✞︎ **ᴘʀᴏᴄᴇss:** ᴅᴀᴛᴀ_ʟᴏᴏᴋᴜᴘ\n│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▭▭▭▭] 30% \n╚═══════════════╝`;

        const mass = await conn.sendMessage(from, { text: techMsg }, { quoted: mek });

        let videoUrl = q;
        let title = "Requested Video";

        // Check if input is a URL, if not, perform a search
        if (!q.startsWith('http')) {
            const searchApi = await fetch(`https://apis.davidcyriltech.my.id/search/xnxx?text=${encodeURIComponent(q)}`);
            const searchData = await searchApi.json();

            if (!searchData.success || !searchData.result.length) {
                return await conn.sendMessage(from, { text: "❌ **CORE ERROR:** NO RESULTS FOUND", edit: mass.key });
            }
            videoUrl = searchData.result[0].link;
            title = searchData.result[0].title;
        }

        // --- PHASE 2: DOWNLOADING STATUS ---
        let downloadMsg = `╔═══════════════╗\n  ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄* ✰\n╟────────────╢\n│ ✞︎ **ᴛɪᴛʟᴇ:** ${title.substring(0, 20)}...\n│ ✞︎ **ʟᴏᴀᴅ:** [▬▬▬▬▬▬▬] 100%\n╟────────────╢\n│ 📥 **sᴛᴀᴛᴜs:** ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...\n╚═══════════════╝`;

        await conn.sendMessage(from, { text: downloadMsg, edit: mass.key });

        // Fetching Video Download Link
        const downloadApi = await fetch(`https://apis.davidcyriltech.my.id/download/xnxx?url=${encodeURIComponent(videoUrl)}`);
        const data = await downloadApi.json();

        if (!data.success || !data.result?.files?.high) {
            return await conn.sendMessage(from, { text: "❌ **FATAL ERROR:** DOWNLOAD LINK NOT FOUND", edit: mass.key });
        }

        // --- PHASE 3: TRANSMISSION ---
        await conn.sendMessage(from, {
            video: { url: data.result.files.high },
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
