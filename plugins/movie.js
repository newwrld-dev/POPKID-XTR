const { cmd } = require('../command');
const axios = require('axios');

// Temporary storage to remember search results for replies
// This stays in memory while the bot is running
if (!global.movie_cache) {
    global.movie_cache = {};
}

/**
 * MOVIE SEARCH COMMAND
 */
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

        // 1. Search for the movie
        const searchApi = `https://api.srihub.store/movie/dinkasearch?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&query=${encodeURIComponent(text)}`;
        const searchRes = await axios.get(searchApi);
        
        if (!searchRes.data.success || !searchRes.data.result.length) {
            return reply(`❌ No results found for *${text}*.`);
        }

        // Use the first result
        const movieUrl = searchRes.data.result[0].url;

        // 2. Fetch download details
        const detailApi = `https://api.srihub.store/movie/dinkadl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(movieUrl)}`;
        const detailRes = await axios.get(detailApi);
        const movie = detailRes.data.result;

        if (!detailRes.data.success || !movie) return reply("❌ Could not fetch movie details.");

        // 3. Save to global cache so we can handle the reply
        global.movie_cache[from] = {
            title: movie.title,
            downloads: movie.downloads
        };

        // 4. Format the menu exactly like your screenshot
        let menuText = `🎬 *${movie.title}*\n\n`;
        movie.downloads.forEach((dl, index) => {
            menuText += `${index + 1} | ❱❱ Download - ${dl.quality} 📁\n`;
        });
        menuText += `\nReply with quality number\n\n© DEW MD BY DEWMINA`;

        // 5. Send poster with the menu
        await conn.sendMessage(from, { 
            image: { url: movie.poster }, 
            caption: menuText 
        }, { quoted: mek });

    } catch (err) {
        console.error("Movie Command Error:", err);
        reply("⚠️ Error connecting to the movie server.");
    }
});

/**
 * REPLY HANDLER (To catch the "3")
 * This command has no pattern; it listens for numbers when a movie is cached.
 */
cmd({
    on: "text"
},
async (conn, mek, m, { from, body, reply }) => {
    const prefix = "."; // Adjust if your prefix is different
    if (body.startsWith(prefix)) return; // Ignore other commands
    
    // Check if the user has a pending movie selection
    if (global.movie_cache[from]) {
        const selectedIndex = parseInt(body.trim()) - 1;
        const movieData = global.movie_cache[from];

        // Check if the input is a valid number from the list
        if (!isNaN(selectedIndex) && movieData.downloads[selectedIndex]) {
            const selectedLink = movieData.downloads[selectedIndex];

            await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

            try {
                // Sending as a document is better for large files (like 500MB+)
                await conn.sendMessage(from, { 
                    document: { url: selectedLink.url }, 
                    mimetype: 'video/mp4', 
                    fileName: `${movieData.title} (${selectedLink.quality}).mp4`,
                    caption: `🎬 *${movieData.title}*\nQuality: ${selectedLink.quality}\n\n© DEW MD BY DEWMINA`
                }, { quoted: mek });

                // Clear cache after sending
                delete global.movie_cache[from];
                
            } catch (uploadError) {
                console.error("Upload Error:", uploadError);
                reply("⚠️ The file is too large or the link expired. Try a lower quality.");
            }
        }
    }
});
