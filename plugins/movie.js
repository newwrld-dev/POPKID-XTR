const { cmd } = require('../command');
const axios = require('axios');

if (!global.movie_cache) global.movie_cache = {};

// ================= MOVIE SEARCH =================
cmd({
    pattern: "movie",
    desc: "Search movie & download",
    category: "media",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ");
        if (!query) return reply("🎬 *Usage:* `.movie venom`");

        let searchData;

        // -------- API 1 (SriHub) --------
        try {
            const res = await axios.get(
                `https://api.srihub.store/movie/dinkasearch`,
                {
                    params: {
                        apikey: process.env.SRIHUB_API || "YOUR_API_KEY",
                        query
                    },
                    timeout: 15000,
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Accept": "application/json"
                    }
                }
            );
            if (res.data?.success) searchData = res.data;
        } catch (e) {
            console.log("API 1 failed");
        }

        // -------- FAIL SAFE --------
        if (!searchData || !searchData.result?.length) {
            return reply("❌ Movie not found or API down.\nTry again later.");
        }

        const movieUrl = searchData.result[0].url;

        // -------- DETAILS --------
        const detail = await axios.get(
            `https://api.srihub.store/movie/dinkadl`,
            {
                params: {
                    apikey: process.env.SRIHUB_API || "YOUR_API_KEY",
                    url: movieUrl
                },
                timeout: 15000,
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json"
                }
            }
        );

        if (!detail.data?.success) {
            return reply("❌ Failed to fetch movie links.");
        }

        const movie = detail.data.result;

        global.movie_cache[from] = {
            title: movie.title,
            downloads: movie.downloads
        };

        let menu = `🎬 *${movie.title}*\n\n`;
        movie.downloads.forEach((q, i) => {
            menu += `${i + 1} | ${q.quality} 📁\n`;
        });
        menu += `\nReply with a number (1–9)\n\n© POPKID MD`;

        await conn.sendMessage(from, {
            image: { url: movie.poster },
            caption: menu
        }, { quoted: mek });

    } catch (err) {
        console.error("MOVIE ERROR:", err);
        reply("⚠️ Unexpected error occurred.");
    }
});

// ================= QUALITY SELECTION =================
cmd({ on: "text" }, async (conn, mek, m, { from, body, reply }) => {
    if (!global.movie_cache[from]) return;
    if (body.startsWith(".") || body.startsWith("/")) return;

    const index = parseInt(body.trim()) - 1;
    const data = global.movie_cache[from];

    if (!data.downloads[index]) return;

    const selected = data.downloads[index];

    try {
        await conn.sendMessage(from, {
            react: { text: "📥", key: mek.key }
        });

        await conn.sendMessage(from, {
            document: { url: selected.url },
            mimetype: "video/mp4",
            fileName: `${data.title} (${selected.quality}).mp4`,
            caption: `🎬 *${data.title}*\nQuality: ${selected.quality}\n\n© POPKID MD`
        }, { quoted: mek });

        delete global.movie_cache[from];

    } catch (e) {
        reply("❌ Failed to send file.");
    }
});
