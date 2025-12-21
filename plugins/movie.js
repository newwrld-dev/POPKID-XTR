const { cmd } = require('../command');
const config = require('../config');
const fetch = require('node-fetch');

cmd({
    pattern: "movie",
    alias: ["baiscope", "mv"],
    react: "🎬",
    desc: "Search and download movies via Baiscope API.",
    category: "download",
    use: ".movie <query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Please provide a movie name to search.");

        // --- PHASE 1: SEARCHING ---
        const searchUrl = `https://api.srihub.store/movie/baiscope?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&q=${encodeURIComponent(q)}`;
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (!data.status || !data.result || data.result.length === 0) {
            return await reply("❌ **CORE ERROR:** No movies found for your query.");
        }

        const movies = data.result.slice(0, 5); // Take top 5 results

        // --- PHASE 2: SEARCH RESULTS BOX ---
        let searchList = `╔═══════════════╗\n   ✰  **𝐌𝐎𝐕𝐈𝐄 𝐒𝐄𝐀𝐑𝐂𝐇** ✰\n╟──────────────╢\n`;
        movies.forEach((mv, index) => {
            searchList += `${index + 1} ➮ ${mv.title.toUpperCase()}\n`;
        });
        searchList += `╚═══════════════╝\n> *Reply with 1 to ${movies.length} to select*`;

        const { key: searchKey } = await conn.sendMessage(from, { text: searchList }, { quoted: mek });

        // --- PHASE 3: INTERACTIVE LISTENER ---
        const listener = async (msg) => {
            const isReply = msg.message?.extendedTextMessage?.contextInfo?.stanzaId === searchKey.id;
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

            if (isReply && msg.key.remoteJid === from && !isNaN(body) && body <= movies.length) {
                conn.ev.off('messages.upsert', listener);

                const selected = movies[parseInt(body) - 1];

                // Fetch full download details for the selected movie
                const detailUrl = `https://api.srihub.store/movie/baiscopedl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(selected.url)}`;
                const detailRes = await fetch(detailUrl);
                const detailData = await detailRes.json();

                if (!detailData.status) return await reply("❌ **ERROR:** Could not fetch download links.");

                const movieData = detailData.result;
                const dlLinks = movieData.download_links; // Array of quality links

                // --- PHASE 4: QUALITY SELECTION BOX ---
                let qualityMsg = `╔══════════════════════╗\n   ✰  **𝐐𝐔𝐀𝐋𝐈𝐓𝐘 𝐂𝐎𝐍𝐅𝐈𝐆** ✰\n╟──────────────────────╢\n│ ✞︎ **ᴛɪᴛʟᴇ:** ${movieData.title.substring(0, 20)}...\n╟──────────────────────╢\n`;
                
                dlLinks.forEach((link, idx) => {
                    qualityMsg += `${idx + 1} ➮ ${link.quality} (${link.size})\n`;
                });

                qualityMsg += `╚══════════════════════╝\n> *Reply with number to download*`;

                const { key: qualKey } = await conn.sendMessage(from, { 
                    image: { url: movieData.thumbnail || config.MENU_IMAGE_URL },
                    caption: qualityMsg 
                }, { quoted: mek });

                // --- PHASE 5: DOWNLOAD EXECUTION ---
                const downloadListener = async (dmsg) => {
                    const isQualReply = dmsg.message?.extendedTextMessage?.contextInfo?.stanzaId === qualKey.id;
                    const dBody = dmsg.message?.conversation || dmsg.message?.extendedTextMessage?.text;

                    if (isQualReply && dmsg.key.remoteJid === from && !isNaN(dBody) && dBody <= dlLinks.length) {
                        conn.ev.off('messages.upsert', downloadListener);

                        const selectedLink = dlLinks[parseInt(dBody) - 1];

                        await conn.sendMessage(from, { text: `📥 **ᴛʀᴀɴsᴍɪᴛᴛɪɴɢ ${selectedLink.quality} ᴅᴏᴄᴜᴍᴇɴᴛ...**`, edit: qualKey });

                        await conn.sendMessage(from, {
                            document: { url: selectedLink.link },
                            mimetype: "video/mp4",
                            fileName: `POPKID_${movieData.title.replace(/\s+/g, '_')}_${selectedLink.quality}.mp4`,
                            caption: `🎬 *${movieData.title}*\n💎 *Quality:* ${selectedLink.quality}\n📦 *Size:* ${selectedLink.size}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴇᴅɪᴀ ⚡`,
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

        conn.ev.on('messages.upsert', async (update) => { for (const m of update.messages) await listener(m); });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** API request failed.`);
    }
});
