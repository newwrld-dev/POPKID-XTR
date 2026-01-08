const { cmd } = require('../command');
const axios = require('axios');

// ======== YOUR API KEY ========
const SRIHUB_API = "dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9";

// ======== SIMPLE CACHE ========
global.movie_cache = global.movie_cache || {};

// ================= MOVIE SEARCH =================
cmd({
    pattern: "movie",
    desc: "Search & download movies",
    category: "media",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(" ").trim();
        if (!query) return reply("🎬 *Usage:* `.movie venom`");

        // --------------- SEARCH -------------------
        const searchRes = await axios.get(
            "https://api.srihub.store/movie/sinhalasub",
            {
                params: { apikey: SRIHUB_API, query },
                timeout: 15000,
                headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
            }
        );

        if (!searchRes.data || searchRes.data.success !== true || !Array.isArray(searchRes.data.result) || searchRes.data.result.length === 0) {
            return reply("❌ Movie not found.");
        }

        const moviePageUrl = searchRes.data.result[0].link;

        // --------------- DETAILS -------------------
        const detailRes = await axios.get(
            "https://api.srihub.store/movie/sinhalasubdl",
            {
                params: { apikey: SRIHUB_API, url: moviePageUrl },
                timeout: 15000,
                headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
            }
        );

        if (!detailRes.data || detailRes.data.success !== true) {
            return reply("❌ Failed to fetch download links.");
        }

        const movie = detailRes.data.result;
        if (!movie || !Array.isArray(movie.downloads) || movie.downloads.length === 0) {
            return reply("❌ No downloadable files found.");
        }

        // --------------- AUTO SD 480P FIRST -------------------
        movie.downloads.sort((a, b) => {
            if (a.quality.includes("480")) return -1;
            if (b.quality.includes("480")) return 1;
            return 0;
        });

        // --------------- CACHE -------------------
        global.movie_cache[from] = {
            title: movie.title || "Movie",
            downloads: movie.downloads
        };

        // --------------- MENU -------------------
        let caption = `🎬 *${movie.title}*\n\n`;
        movie.downloads.forEach((d, i) => {
            caption += `${i + 1} | ${d.quality} 📁\n`;
        });
        caption += `\nReply with a number (1–${movie.downloads.length})\n\n© POPKID MD`;

        await conn.sendMessage(from, { image: { url: movie.poster }, caption }, { quoted: mek });

    } catch (err) {
        console.error("MOVIE ERROR:", err?.response?.data || err.message);
        reply("⚠️ Movie service error. Try again later.");
    }
});

// ================= QUALITY SELECTION =================
cmd({ on: "text" }, async (conn, mek, m, { from, body }) => {
    if (!global.movie_cache[from]) return;
    if (body.startsWith(".") || body.startsWith("/")) return;

    const index = parseInt(body.trim()) - 1;
    const cache = global.movie_cache[from];

    if (isNaN(index) || !cache.downloads[index]) return;

    const selected = cache.downloads[index];

    try {
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        await conn.sendMessage(
            from,
            {
                document: { url: selected.url },
                mimetype: "video/mp4",
                fileName: `${cache.title} (${selected.quality}).mp4`,
                caption: `🎬 *${cache.title}*\nQuality: ${selected.quality}\n\n© POPKID MD`
            },
            { quoted: mek }
        );

    } catch (e) {
        await conn.sendMessage(from, { text: "❌ Failed to send file." });
    } finally {
        delete global.movie_cache[from];
    }
});
