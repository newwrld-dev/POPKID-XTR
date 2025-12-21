const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "play",
    alias: ["song", "music"],
    desc: "Advanced tech audio downloader.",
    category: "download",
    use: ".play <query>",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, q, sender }) => {
    try {
        if (!q) return reply("⚙️ SYSTEM: Input required (Title or URL).");

        // --- PHASE 1: INITIALIZING ---  
        let techMsg = `╔══════════════╗
✰  𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄 ✰
╟──────────────╢
│ ✞︎ sᴛᴀᴛᴜs: sᴄᴀɴɴɪɴɢ... 📡
│ ✞︎ ᴛᴀʀɢᴇᴛ: ${q.substring(0, 15)}...
│ ✞︎ ʟᴏᴀᴅ: [▬▬▬▭▭▭▭] 30%
╚════════════════╝`;

        const sentMsg = await conn.sendMessage(from, { text: techMsg }, { quoted: mek });
        const key = sentMsg.key; // Reference for editing

        // --- PHASE 2: DATA FETCHING ---
        const url = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.status || !data.result?.download_url) {
            return await conn.sendMessage(from, { text: "❌ **FATAL ERROR:** DATA NOT FOUND", edit: key });
        }

        const song = data.result;

        // --- PHASE 3: SELECTION MENU ---  
        let selectionMsg = `╔════════════════╗
✰  𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐎𝐑𝐄 ✰
╟───────────────╢
│ ✞︎ ᴛɪᴛʟᴇ: ${song.title.substring(0, 25)}
│ ✞︎ ᴅᴜʀᴀᴛɪᴏɴ: ${song.duration || 'N/A'}
│ ✞︎ ʟᴏᴀᴅ: [▬▬▬▬▬▬▬] 100%
╟───────────────╢
│  sᴇʟᴇᴄᴛ ᴛʀᴀɴsᴍɪssɪᴏɴ:
│
│  1 ➮ ᴀᴜᴅɪᴏ (ᴍᴘ3) 🎵
│  2 ➮ ᴅᴏᴄᴜᴍᴇɴᴛ (ғɪʟᴇ) 📂
│  3 ➮ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ (ᴘᴛᴛ) 🎤
╚═════════════════╝
> Reply with 1, 2, or 3`;

        await conn.sendMessage(from, { text: selectionMsg, edit: key });

        // --- PHASE 4: INTERACTIVE LISTENER ---  
        const listener = async (chatUpdate) => {
            const m = chatUpdate.messages[0];
            if (!m.message) return;

            // Get text from reply
            const body = m.message.conversation || 
                         m.message.extendedTextMessage?.text || 
                         "";

            // Verify if this is a reply to the bot's specific selection message
            const isReplyToBot = m.message.extendedTextMessage?.contextInfo?.stanzaId === key.id;

            if (isReplyToBot && ['1', '2', '3'].includes(body)) {
                // Remove listener immediately
                conn.ev.off('messages.upsert', listener);

                // Add loading reaction
                await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

                let commonConfig = {
                    audio: { url: song.download_url },
                    mimetype: "audio/mpeg",
                    contextInfo: {
                        externalAdReply: {
                            title: "『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 』",
                            body: song.title,
                            thumbnailUrl: song.thumbnail || config.MENU_IMAGE_URL,
                            sourceUrl: "https://github.com/popkidmd/POPKID-MD",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                };

                try {
                    if (body === '1') {
                        await conn.sendMessage(from, commonConfig, { quoted: m });
                    } else if (body === '2') {
                        await conn.sendMessage(from, {
                            document: { url: song.download_url },
                            mimetype: "audio/mpeg",
                            fileName: `${song.title}.mp3`
                        }, { quoted: m });
                    } else if (body === '3') {
                        await conn.sendMessage(from, { ...commonConfig, ptt: true }, { quoted: m });
                    }

                    await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
                } catch (sendError) {
                    console.error("Upload Error:", sendError);
                    reply("❌ Error during transmission.");
                }
            }
        };

        // Start listening for responses
        conn.ev.on('messages.upsert', listener);

        // --- PHASE 5: AUTO-EXPIRATION (2 Minutes) ---
        setTimeout(() => {
            conn.ev.off('messages.upsert', listener);
        }, 120000);

    } catch (err) {
        console.error("Global Error:", err);
        reply("⚠️ SYSTEM ERROR: Unable to process request.");
    }
});
