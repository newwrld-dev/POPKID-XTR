const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["dinka", "mv"],
    react: "🎬",
    desc: "Download movies via SriHub Dinka API.",
    category: "download",
    use: ".movie <url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Please provide a valid DinkaMovies URL.");

        // --- PHASE 1: API HANDSHAKE ---
        const apiUrl = `https://api.srihub.store/movie/dinkadl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(q)}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.status || !data.result) {
            return await reply("❌ **CORE ERROR:** INVALID URL OR API KEY EXPIRED");
        }

        const movie = data.result;
        const links = movie.download_links; // Contains the quality options

        // --- PHASE 2: INSTANT QUALITY SELECTION ---
        let selectionMsg = `╔════════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐈𝐍𝐄𝐌𝐀** ✰
╟────────────────╢
│ ✞︎ **ᴍᴏᴠɪᴇ:** ${movie.title.toUpperCase().substring(0, 20)}
│ ✞︎ **sɪᴢᴇ:** ${movie.size || 'Variable'}
╟────────────────╢
│  **sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:**
│
│  1 ➮ 𝟹𝟼𝟶ᴘ (ʟᴏᴡ) 📉
│  2 ➮ 𝟺𝟾𝟶ᴘ (ᴍᴇᴅ) 🎬
│  3 ➮ 𝟽𝟸𝟶ᴘ (ʜᴅ) 💎
│  4 ➮ 𝟷𝟶𝟾𝟶ᴘ (ғᴜʟʟ) 🔥
╚════════════════╝
> *Reply with 1, 2, 3, or 4*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: movie.thumbnail || config.MENU_IMAGE_URL },
            caption: selectionMsg 
        }, { quoted: mek });

        // --- PHASE 3: INTERACTIVE DOWNLOADER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && ['1', '2', '3', '4'].includes(body)) {
                conn.ev.off('messages.upsert', listener);

                // Map selection to API result keys
                const qualityMap = { '1': '360p', '2': '480p', '3': '720p', '4': '1080p' };
                const selectedQual = qualityMap[body];
                const finalUrl = links[selectedQual] || links[Object.keys(links)[0]];

                // Update box with loader
                let loadingMsg = selectionMsg.replace('sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:', `📥 **ᴛʀᴀɴsᴍɪᴛᴛɪɴɢ ${selectedQual}...**`);
                loadingMsg += `\n [▬▬▬▭▭▭▭▭▭▭] 45%`;
                await conn.sendMessage(from, { text: loadingMsg, edit: key });

                // --- PHASE 4: TRANSMISSION AS DOCUMENT ---
                await conn.sendMessage(from, {
                    document: { url: finalUrl },
                    mimetype: "video/mp4",
                    fileName: `POPKID_MD_${movie.title.replace(/\s+/g, '_')}_${selectedQual}.mp4`,
                    caption: `🎬 *${movie.title}*\n💎 *Quality:* ${selectedQual}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363289379419860@newsletter',
                            newsletterName: '『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐎𝐕𝐈𝐄𝐒 』'
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
        await reply(`❌ **SYSTEM ERROR:** Request failed.`);
    }
});
