const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["cineverse", "mv"],
    react: "🎬",
    desc: "Search and download movies from Cineverse.",
    category: "download",
    use: ".movie <movie name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a movie name.");

        // --- PHASE 1: API SEARCH ---
        const apiUrl = `https://apis.davidcyriltech.my.id/cineverse?q=${encodeURIComponent(q)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.status || !data.result || data.result.length === 0) {
            return await reply("❌ **CORE ERROR:** MOVIE NOT FOUND IN DATABASE");
        }

        // Get the first result
        const movie = data.result[0];

        // --- PHASE 2: MOVIE INTERFACE ---
        let selectionMsg = `╔══════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐈𝐍𝐄𝐌𝐀** ✰
╟─────────────╢
│ ✞︎ **ᴛɪᴛʟᴇ:** ${movie.title.toUpperCase()}
│ ✞︎ **ʀᴇʟᴇᴀsᴇ:** ${movie.release || 'N/A'}
╟─────────────╢
│  **sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:**
│
│  1 ➮ **𝟺𝟾𝟶ᴘ (sᴅ)** 📱
│  2 ➮ **𝟽𝟸𝟶ᴘ (ʜᴅ)** 🎬
│  3 ➮ **𝟷𝟶𝟾𝟶ᴘ (ғᴜʟʟ ʜᴅ)** 💎
╚══════════════╝
> *Reply with 1, 2, or 3*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: movie.thumbnail || config.MENU_IMAGE_URL },
            caption: selectionMsg 
        }, { quoted: mek });

        // --- PHASE 3: INTERACTIVE DOWNLOADER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && ['1', '2', '3'].includes(body)) {
                conn.ev.off('messages.upsert', listener);

                let quality = body === '1' ? '480p' : body === '2' ? '720p' : '1080p';

                // Update box to show Processing
                let loadingMsg = selectionMsg.replace('sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:', `📥 **ᴘʀᴇᴘᴀʀɪɴɢ ${quality}...**`);
                loadingMsg += `\n [▬▬▬▭▭▭▭▭▭▭] 40%`;
                await conn.sendMessage(from, { text: loadingMsg, edit: key });

                // Since movie files are large, we use document format
                // Note: The API must provide a direct download link in the 'movie.links' or similar property
                const downloadUrl = movie.links?.[quality] || movie.download_url;

                if (!downloadUrl) {
                    return await conn.sendMessage(from, { text: "❌ **ERROR:** QUALITY NOT AVAILABLE", edit: key });
                }

                // Final Loader
                await conn.sendMessage(from, { text: loadingMsg.replace('40%', '100%'), edit: key });

                // --- PHASE 4: SEND AS DOCUMENT ---
                await conn.sendMessage(from, {
                    document: { url: downloadUrl },
                    mimetype: "video/mp4",
                    fileName: `POPKID_MD_${movie.title}_${quality}.mp4`,
                    caption: `🎬 *${movie.title}*\n📡 *Quality:* ${quality}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363289379419860@newsletter',
                            newsletterName: '『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐎𝐕𝐈𝐄𝐒 』',
                            serverMessageId: 143
                        }
                    }
                }, { quoted: mek });

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
