const { cmd } = require('../command');
const axios = require('axios');

// Storage for movie selection
if (!global.movie_cache) {
    global.movie_cache = {};
}

// 1. MAIN SEARCH COMMAND
cmd({
    pattern: "movie",
    desc: "Search for a movie and get a download menu",
    category: "media",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {
        const text = args.join(" ");
        if (!text) return reply("🎬 Please provide a movie name.\n\nExample: .movie venom");

        // Use a try-catch specifically for the API call to debug connection issues
        let searchRes;
        try {
            const searchApi = `https://api.srihub.store/movie/dinkasearch?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&query=${encodeURIComponent(text)}`;
            searchRes = await axios.get(searchApi);
        } catch (apiErr) {
            return reply("⚠️ API Connection Error. The server might be down or the API key is expired.");
        }
        
        if (!searchRes.data || !searchRes.data.success || !searchRes.data.result.length) {
            return reply(`❌ No results found for *${text}*.`);
        }

        const movieUrl = searchRes.data.result[0].url;

        // Fetch download links
        const detailApi = `https://api.srihub.store/movie/dinkadl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(movieUrl)}`;
        const detailRes = await axios.get(detailApi);
        const movie = detailRes.data.result;

        if (!detailRes.data.success || !movie) return reply("❌ Could not fetch movie details.");

        // Store data for the reply listener
        global.movie_cache[from] = {
            title: movie.title,
            downloads: movie.downloads
        };

        // Format menu to match your screenshot
        let menuText = `🎬 *${movie.title}*\n\n`;
        movie.downloads.forEach((dl, index) => {
            menuText += `${index + 1} | ❱❱ Download - ${dl.quality} 📁\n`;
        });
        menuText += `\nReply with quality number\n\n© DEW MD BY DEWMINA`;

        await conn.sendMessage(from, { 
            image: { url: movie.poster }, 
            caption: menuText 
        }, { quoted: mek });

    } catch (err) {
        console.error("Movie Error:", err);
        reply("⚠️ An unexpected error occurred. Please check bot logs.");
    }
});

// 2. SELECTION LISTENER (The "3" Reply)
cmd({
    on: "text"
},
async (conn, mek, m, { from, body, reply }) => {
    // Only trigger if there is a pending movie search for this user
    if (global.movie_cache[from]) {
        const input = body.trim();
        
        // Ignore if it's another command
        if (input.startsWith(".") || input.startsWith("/")) return;

        const index = parseInt(input) - 1;
        const movieData = global.movie_cache[from];

        if (!isNaN(index) && movieData.downloads[index]) {
            const selected = movieData.downloads[index];

            // Feedback react
            await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

            try {
                // Sending as document to handle large files (like 566MB in your screenshot)
                await conn.sendMessage(from, { 
                    document: { url: selected.url }, 
                    mimetype: 'video/mp4', 
                    fileName: `${movieData.title} (${selected.quality}).mp4`,
                    caption: `🎬 *${movieData.title}*\nQuality: ${selected.quality}\n\n© DEW MD BY DEWMINA`
                }, { quoted: mek });

                // Success! Clear cache
                delete global.movie_cache[from];
                
            } catch (e) {
                reply("❌ Failed to send file. It might be too large for the bot's server.");
            }
        }
    }
});
