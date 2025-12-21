const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["mv", "sinhalasub"],
    react: "🎬",
    desc: "Search and download movies via SinhalaSub.",
    category: "download",
    use: ".movie <movie name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a movie name.");

        // --- PHASE 1: SEARCHING SINHALASUB ---
        // We use a search API to find the correct URL first
        const searchUrl = `https://api.srihub.store/movie/sinhalasub?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&q=${encodeURIComponent(q)}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.status || !searchData.result?.length) {
            return await reply("❌ **CORE ERROR:** Movie not found on SinhalaSub.");
        }

        // We take the first result automatically to keep it fast
        const targetUrl = searchData.result[0].url;
        const movieTitle = searchData.result[0].title;

        // --- PHASE 2: FETCHING DOWNLOAD LINKS ---
        const dlApi = `https://api.srihub.store/movie/sinhalasubdl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(targetUrl)}`;
        const dlRes = await fetch(dlApi);
        const dlData = await dlRes.json();

        if (!dlData.status || !dlData.result) {
            return await reply("❌ **CORE ERROR:** Could not extract download links.");
        }

        const movie = dlData.result;
        const links = movie.download_links; // This is the array of qualities

        // --- PHASE 3: SINGLE BOX QUALITY SELECTION ---
        let selectionMsg = `╔══════════════════════╗
   ✰  **𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐂𝐈𝐍𝐄𝐌𝐀** ✰
╟──────────────────────╢
│ ✞︎ **ᴍᴏᴠɪᴇ:** ${movie.title.toUpperCase().substring(0, 20)}
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

                // Edit box to show "Processing"
                await conn.sendMessage(from, { 
                    text: selectionMsg.replace('sᴇʟᴇᴄᴛ ǫᴜᴀʟɪᴛʏ:', `📥 **ᴘʀᴇᴘᴀʀɪɴɢ ${selected.quality}...**`), 
                    edit: key 
                });

                // --- PHASE 5: SEND AS DOCUMENT ---
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
        await reply(`❌ **SYSTEM ERROR:** Connection failed.`);
    }
});
