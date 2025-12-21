const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["cineverse", "mv"],
    react: "🎬",
    desc: "Search and download movies with quality selection.",
    category: "download",
    use: ".movie <movie name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Input required. Please provide a movie name.");

        // --- PHASE 1: SEARCHING ---
        const searchUrl = `https://apis.davidcyriltech.my.id/cineverse?q=${encodeURIComponent(q)}`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        // Check if data exists in the result array
        if (!data.success || !data.result || data.result.length === 0) {
            return await reply(`❌ **CORE ERROR:** No results found for "${q}". Try a more specific title.`);
        }

        // --- PHASE 2: DISPLAY SEARCH RESULTS ---
        let resultsList = `╔══════════════╗\n   ✰  **𝐌𝐎𝐕𝐈𝐄 𝐒𝐄𝐀𝐑𝐂𝐇** ✰\n╟──────────────────────╢\n`;
        
        // Map first 5 results
        const movies = data.result.slice(0, 5);
        movies.forEach((mv, index) => {
            resultsList += `${index + 1} ➮ ${mv.title} (${mv.year || 'N/A'})\n`;
        });
        
        resultsList += `╚══════════════╝\n> *Reply with 1 to ${movies.length} to select*`;

        const { key: searchKey } = await conn.sendMessage(from, { text: resultsList }, { quoted: mek });

        // --- PHASE 3: INTERACTIVE LISTENER (MOVIE SELECTION) ---
        const movieListener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === searchKey.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && !isNaN(body) && body <= movies.length) {
                conn.ev.off('messages.upsert', movieListener); // Stop search listener
                
                const selectedMovie = movies[parseInt(body) - 1];

                // --- PHASE 4: QUALITY SELECTION ---
                let qualityMsg = `╔══════════════╗\n   ✰  **𝐐𝐔𝐀𝐋𝐈𝐓𝐘 𝐂𝐎𝐍𝐅𝐈𝐆** ✰\n╟───────────────╢\n│ ✞︎ **ᴛɪᴛʟᴇ:** ${selectedMovie.title}\n╟───────────────╢\n│  1 ➮ 𝟺𝟾𝟶ᴘ (sᴅ)\n│  2 ➮ 𝟽𝟸𝟶ᴘ (ʜᴅ)\n│  3 ➮ 𝟷𝟶𝟾𝟶ᴘ (ғᴜʟʟ ʜᴅ)\n╚══════════════╝\n> *Reply with 1, 2, or 3*`;

                const { key: qualKey } = await conn.sendMessage(from, { 
                    image: { url: selectedMovie.thumbnail },
                    caption: qualityMsg 
                }, { quoted: mek });

                // --- PHASE 5: DOWNLOAD LISTENER ---
                const downloadListener = async (dmsg) => {
                    const isQualReply = dmsg.message?.extendedTextMessage?.contextInfo?.stanzaId === qualKey.id;
                    const dBody = dmsg.message?.conversation || dmsg.message?.extendedTextMessage?.text;

                    if (isQualReply && dmsg.key.remoteJid === from && ['1', '2', '3'].includes(dBody)) {
                        conn.ev.off('messages.upsert', downloadListener);

                        const qualLabel = dBody === '1' ? '480p' : dBody === '2' ? '720p' : '1080p';
                        
                        await conn.sendMessage(from, { text: `📥 **ᴛʀᴀɴsᴍɪᴛᴛɪɴɢ ${qualLabel} ᴅᴏᴄᴜᴍᴇɴᴛ...**`, edit: qualKey });

                        // Final Document Send
                        await conn.sendMessage(from, {
                            document: { url: selectedMovie.download_url }, // Uses the direct link from API
                            mimetype: "video/mp4",
                            fileName: `POPKID_${selectedMovie.title.replace(/\s+/g, '_')}_${qualLabel}.mp4`,
                            caption: `🎬 *${selectedMovie.title}*\n💎 *Quality:* ${qualLabel}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
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
                conn.ev.on('messages.upsert', async (update) => { for (const m of update.messages) await downloadListener(m); });
            }
        };
        conn.ev.on('messages.upsert', async (update) => { for (const m of update.messages) await movieListener(m); });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** API Timeout or Invalid Response.`);
    }
});
