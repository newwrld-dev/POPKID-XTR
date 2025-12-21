const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["mv", "sinhalasub"],
    react: "🎬",
    desc: "Premium SinhalaSub movie downloader with auto-slug generation.",
    category: "download",
    use: ".movie <ne-zha-2-2025-sinhala-subtitles>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide the movie name slug.\n\n*Example:* .movie ne-zha-2-2025-sinhala-subtitles");

        // --- PHASE 1: SMART URL BUILDER ---
        // Automatically formats the request to match the Sinhalasub directory
        const baseUrl = "https://sinhalasub.lk/movies/";
        let movieSlug = q.trim().toLowerCase().replace(/\s+/g, '-');
        
        // Ensure it doesn't have double slashes if user input varies
        const fullMovieUrl = `${baseUrl}${movieSlug.replace(baseUrl, '')}/`;

        // --- PHASE 2: SRIHUB API INTEGRATION ---
        // Using your exact API Key from the dashboard screenshot
        const apiUrl = `https://api.srihub.store/movie/sinhalasubdl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(fullMovieUrl)}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.status || !data.result) {
            return await reply("❌ **CORE ERROR:** Data extraction failed.\n\n*Check if the name matches the website URL exactly.*");
        }

        const movie = data.result;
        const links = movie.download_links; // Array of quality options provided by SriHub

        // --- PHASE 3: PREMIUM SELECTION INTERFACE ---
        let selectionMsg = `╔══════════════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐈𝐍𝐄𝐌𝐀** ✰
╟──────────────────────╢
│ ✞︎ **ᴍᴏᴠɪᴇ:** ${movie.title.toUpperCase().substring(0, 25)}
│ ✞︎ **ʏᴇᴀʀ:** ${movie.year || '2025'}
╟──────────────────────╢
│  **sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:**\n│\n`;

        links.forEach((link, index) => {
            selectionMsg += `│  ${index + 1} ➮ ${link.quality} (${link.size})\n`;
        });

        selectionMsg += `╚══════════════════════╝
> *Reply with number to download*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: movie.thumbnail || config.MENU_IMAGE_URL },
            caption: selectionMsg 
        }, { quoted: mek });

        // --- PHASE 4: INTERACTIVE LISTENER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && !isNaN(body) && body <= links.length) {
                conn.ev.off('messages.upsert', listener);

                const selected = links[parseInt(body) - 1];

                // Single-Box Live Update
                await conn.sendMessage(from, { 
                    text: selectionMsg.replace('sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:', `📥 **ᴘʀᴇᴘᴀʀɪɴɢ ${selected.quality}...**`), 
                    edit: key 
                });

                // --- PHASE 5: DOCUMENT TRANSMISSION ---
                // Sent as document to bypass WhatsApp video compression
                await conn.sendMessage(from, {
                    document: { url: selected.link },
                    mimetype: "video/mp4",
                    fileName: `POPKID_MD_${movie.title.replace(/\s+/g, '_')}_${selected.quality}.mp4`,
                    caption: `🎬 *${movie.title}*\n💎 *Quality:* ${selected.quality}\n📦 *Size:* ${selected.size}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
                    contextInfo: {
                        mentionedJid: [sender],
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
        await reply(`❌ **SYSTEM ERROR:** Connection timed out.`);
    }
});
