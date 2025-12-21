const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');

cmd({
    pattern: "play",
    alias: ["ytplay", "music"],
    react: "🛰️",
    desc: "Download audio from YouTube",
    category: "download",
    use: ".play <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a song name or URL.");

        // --- PHASE 1: SEARCH DATA ---
        let videoUrl, title, timestamp, thumbnail;
        
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoId = q.split(/[=/]/).pop();
            const videoInfo = await yts({ videoId });
            title = videoInfo.title;
            timestamp = videoInfo.timestamp || 'N/A';
            thumbnail = videoInfo.thumbnail;
        } else {
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ **CORE ERROR:** NOT FOUND");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
            timestamp = search.videos[0].timestamp;
            thumbnail = search.videos[0].thumbnail;
        }

        // --- PHASE 2: IMMEDIATE SELECTION BOX ---
        let selectionMsg = `╔═══════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄** ✰
╟──────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${title.toUpperCase().substring(0, 20)}
│ ✞︎ **ᴅᴜʀᴀᴛɪᴏɴ:** ${timestamp}
╟──────────────╢
│  **sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:**
│
│  1 ➮ ᴀᴜᴅɪᴏ (ᴍᴘ3) 🎵
│  2 ➮ ᴅᴏᴄᴜᴍᴇɴᴛ (ғɪʟᴇ) 📂
│  3 ➮ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ (ᴘᴛᴛ) 🎤
╚═══════════════╝
> *Reply with 1, 2, or 3*`;

        const { key } = await conn.sendMessage(from, { text: selectionMsg }, { quoted: mek });

        // --- PHASE 3: RESPONSE LISTENER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && ['1', '2', '3'].includes(body)) {
                conn.ev.off('messages.upsert', listener);

                // Start Loading animation ONLY after selection
                let processingMsg = selectionMsg.replace('sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:', '📥 **ᴘʀᴏᴄᴇssɪɴɢ ᴅᴀᴛᴀ...**');
                processingMsg += `\n [▬▬▬▭▭▭▭▭▭▭] 40%`;
                await conn.sendMessage(from, { text: processingMsg, edit: key });

                const apiUrl = `https://api.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(videoUrl)}`;
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (!data.success) return await conn.sendMessage(from, { text: "❌ **FATAL ERROR:** DOWNLOAD FAILED", edit: key });

                // Finish Loader
                let finishMsg = selectionMsg.replace('sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:', '✅ **ᴛʀᴀɴsᴍɪssɪᴏɴ ʀᴇᴀᴅʏ**');
                finishMsg += `\n [▬▬▬▬▬▬▬▬▬▬▬] 100%`;
                await conn.sendMessage(from, { text: finishMsg, edit: key });

                let commonConfig = {
                    audio: { url: data.result.download_url },
                    mimetype: 'audio/mpeg',
                    contextInfo: {
                        externalAdReply: {
                            title: "『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑 』",
                            body: title,
                            thumbnailUrl: thumbnail,
                            sourceUrl: videoUrl,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                };

                if (body === '1') {
                    await conn.sendMessage(from, { ...commonConfig, ptt: false }, { quoted: mek });
                } else if (body === '2') {
                    await conn.sendMessage(from, {
                        document: { url: data.result.download_url },
                        mimetype: 'audio/mpeg',
                        fileName: `${title}.mp3`
                    }, { quoted: mek });
                } else if (body === '3') {
                    await conn.sendMessage(from, { ...commonConfig, ptt: true }, { quoted: mek });
                }

                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            }
        };

        conn.ev.on('messages.upsert', async (chatUpdate) => {
            for (const msg of chatUpdate.messages) { await listener(msg); }
        });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** ${error.message}`);
    }
});
