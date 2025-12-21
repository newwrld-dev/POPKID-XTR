const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["mv", "sinhalasub"],
    react: "🎬",
    desc: "Premium Sinhalasub movie downloader.",
    category: "download",
    use: ".movie <ne-zha-2-2025-sinhala-subtitles>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide the movie slug.");

        // --- PHASE 1: SMART URL GENERATION ---
        const baseUrl = "https://sinhalasub.lk/movies/";
        // Automatically formats input into the Sinhalasub URL format
        let movieSlug = q.trim().toLowerCase().replace(/\s+/g, '-');
        const fullMovieUrl = `${baseUrl}${movieSlug.replace(baseUrl, '')}/`;

        // --- PHASE 2: SRIHUB API INTEGRATION ---
        // Uses the exact API endpoint and key shown in your screenshot
        const apiUrl = `https://api.srihub.store/movie/sinhalasubdl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(fullMovieUrl)}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.status || !data.result) {
            return await reply("❌ **CORE ERROR:** Extraction failed. Please check the movie slug.");
        }

        const movie = data.result;
        const links = movie.download_links;

        // --- PHASE 3: PRINCE MDX STYLE MENU ---
        let infoMsg = `╭──────────────────╮
│  𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐌𝐎𝐕𝐈𝐄 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃
╰──────────────────╯

➠ **Title** : ${movie.title}
➠ **Release Date**: ${movie.year || '2025'}
➠ **IMDb** : ${movie.imdb || '8.0'}  
➠ **Movie Link** : ${fullMovieUrl}
─────────────────────

  *01 ||* Send Details
  *02 ||* Send Images\n\n`;

        // Map quality links starting from number 03 to match your reference
        links.forEach((link, index) => {
            const num = (index + 3).toString().padStart(2, '0'); 
            infoMsg += `  *${num} ||* ${link.quality} [ ${link.size} (\`SINHALASUB SERVER\`) ]\n`;
        });

        infoMsg += `\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: movie.thumbnail || config.MENU_IMAGE_URL },
            caption: infoMsg 
        }, { quoted: mek });

        // --- PHASE 4: INTERACTIVE SELECTION ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && !isNaN(body)) {
                const choice = parseInt(body);

                // Check if the choice corresponds to an available link index
                if (choice >= 3 && choice < (links.length + 3)) {
                    conn.ev.off('messages.upsert', listener);
                    const selected = links[choice - 3];

                    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

                    // --- PHASE 5: DOCUMENT TRANSMISSION ---
                    // Sends the file as a document to ensure full quality
                    await conn.sendMessage(from, {
                        document: { url: selected.link },
                        mimetype: "video/mp4",
                        fileName: `POPKID_MD_${movie.title.replace(/\s+/g, '_')}_${selected.quality}.mp4`,
                        caption: `${movie.title}\n( ${selected.quality} )\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ*`,
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
            }
        };

        conn.ev.on('messages.upsert', async (chatUpdate) => {
            for (const msg of chatUpdate.messages) { await listener(msg); }
        });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** Failed to process the request.`);
    }
});
