const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["mv", "sinhalasub", "prince"],
    react: "🎬",
    desc: "Premium SinhalaSub downloader with exact Prince MDX styling.",
    category: "download",
    use: ".movie <ne-zha-2-2025-sinhala-subtitles>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide the movie slug.\n\n*Example:* .movie ne-zha-2-2025-sinhala-subtitles");

        // --- PHASE 1: SMART URL & API HANDSHAKE ---
        // Automatically constructs the SinhalaSub directory URL
        const baseUrl = "https://sinhalasub.lk/movies/";
        let movieSlug = q.trim().toLowerCase().replace(/\s+/g, '-');
        const fullMovieUrl = `${baseUrl}${movieSlug.replace(baseUrl, '')}/`;

        // Authenticated request using your SriHub API Key from the dashboard
        const apiUrl = `https://api.srihub.store/movie/sinhalasubdl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(fullMovieUrl)}`;
        
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.status || !data.result) {
            return await reply("❌ **CORE ERROR:** Extraction failed. Check if the movie slug matches the Sinhalasub URL.");
        }

        const movie = data.result;
        const links = movie.download_links; // Array of quality and server options

        // --- PHASE 2: PRINCE MDX STYLE MENU CONSTRUCTION ---
        // Styled with rounded corners and metadata labels to match your reference
        let infoMsg = `╭──────────────────╮
│ PRINCE MDX MOVIE DOWNLOAD
╰──────────────────╯

➠ **Title** : ${movie.title}
➠ **Release Date**: ${movie.year || 'N/A'}
➠ **Country** : ${movie.country || 'N/A'}
➠ **Duration** :  IMDb: ${movie.imdb || '8.0'}  
➠ **Movie Link** : ${fullMovieUrl}
➠ **Categories** : ${movie.genres || 'Action,Adventure,Animation,Fantasy'}
➠ **Director** : ${movie.director || 'N/A'}
─────────────────────

  *01 ||* Send Details
  *02 ||* Send Images\n\n`;

        // Numbering starts from 03 to ensure '11' or higher aligns with the server list
        links.forEach((link, index) => {
            const num = (index + 3).toString().padStart(2, '0'); 
            infoMsg += `  *${num} ||* ${link.quality} [ ${link.size} (\`SINHALASUB SERVER\`) ]\n`;
        });

        infoMsg += `  *${(links.length + 3).toString().padStart(2, '0')} ||* Subtitles [ ---- (\`Unknown\`) ]\n`;
        infoMsg += `\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ*`;

        const { key } = await conn.sendMessage(from, { 
            image: { url: movie.thumbnail || config.MENU_IMAGE_URL },
            caption: infoMsg 
        }, { quoted: mek });

        // --- PHASE 3: INTERACTIVE CHOICE HANDLER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === key.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && !isNaN(body)) {
                const choice = parseInt(body);

                // Matches the number (e.g., 11) to the corresponding link in the array
                if (choice >= 3 && choice < (links.length + 3)) {
                    conn.ev.off('messages.upsert', listener);
                    const selected = links[choice - 3];

                    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

                    // --- PHASE 4: DOCUMENT TRANSMISSION ---
                    // Sent as a document to bypass compression and keep original clarity
                    await conn.sendMessage(from, {
                        document: { url: selected.link },
                        mimetype: "video/mp4",
                        fileName: `PRINCE_MDX_${movie.title.split(' ')[0]}_${selected.quality}.mp4`,
                        caption: `${movie.title}\n( ${selected.quality} )\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘʀɪɴᴄᴇ ᴛᴇᴄʜ*`,
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
        await reply(`❌ **SYSTEM ERROR:** Link processing failed.`);
    }
});
