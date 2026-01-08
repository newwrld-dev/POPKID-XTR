const fetch = require('node-fetch');
const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "movie",
    desc: "Fetch Sinhala dubbed movie info or auto download MP4",
    category: "media",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, args }) => {
    try {
        const text = args.join(" ");
        if (!text)
            return conn.sendMessage(from, { text: "🎬 Provide a movie name or link.\n\nExample:\n.movie venom" }, { quoted: mek });

        const loading = await conn.sendMessage(from, { text: "🔍 Searching for movie..." }, { quoted: mek });

        let movieUrl = "";
        // If direct link
        if (text.includes("dinkamovieslk.blogspot.com")) {
            movieUrl = text.trim();
        } else {
            // Search by name
            const searchApi = `https://api.srihub.store/movie/dinkasearch?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&query=${encodeURIComponent(text)}`;
            const searchRes = await fetch(searchApi);
            const searchData = await searchRes.json();

            if (!searchData.success || !searchData.result?.length)
                return conn.sendMessage(from, { text: `❌ No results found for *${text}*.` }, { quoted: mek });

            movieUrl = searchData.result[0].url;
        }

        // Get movie details
        const apiURL = `https://api.srihub.store/movie/dinkadl?apikey=dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9&url=${encodeURIComponent(movieUrl)}`;
        const res = await fetch(apiURL);
        const data = await res.json();

        if (!data.success || !data.result)
            return conn.sendMessage(from, { text: "❌ Could not fetch movie details." }, { quoted: mek });

        const movie = data.result;

        // Format info
        let caption = `🎬 *${movie.title}*\n\n📖 *Description:*\n${movie.description.slice(0, 400)}...\n\n`;
        caption += `📥 *Download Options:*\n`;
        movie.downloads.forEach(dl => {
            caption += `\n🔹 *${dl.quality}* ➤ ${dl.url}`;
        });

        await conn.sendMessage(from, { image: { url: movie.poster }, caption }, { quoted: mek });

        // Attempt auto-download for smallest file (480p)
        const smallest = movie.downloads.find(d => d.quality.includes("480")) || movie.downloads[0];
        const url = smallest.url;

        const tempFile = path.join(__dirname, `temp_${Date.now()}.mp4`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        let totalLength = parseInt(response.headers['content-length'] || "0");
        if (totalLength > 100 * 1024 * 1024) {
            // Too large to send
            await conn.sendMessage(from, {
                text: `⚠️ The file is too large to send via WhatsApp.\n\n📥 Download manually:\n${url}`
            }, { quoted: mek });
        } else {
            // Save locally
            const writer = fs.createWriteStream(tempFile);
            response.data.pipe(writer);
            await new Promise(resolve => writer.on('finish', resolve));

            // Send the MP4 file
            await conn.sendMessage(from, {
                video: { url: tempFile },
                caption: `🎬 *${movie.title}* (480p)`,
                mimetype: "video/mp4"
            }, { quoted: mek });

            fs.unlinkSync(tempFile); // delete after sending
        }

        await conn.sendMessage(from, { text: "✅ Movie sent successfully!", edit: loading.key });

    } catch (err) {
        console.error("🎬 Movie Command Error:", err);
        conn.sendMessage(from, { text: "⚠️ Error fetching or sending the movie." }, { quoted: mek });
    }
});
