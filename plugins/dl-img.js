const { cmd } = require("../command");
const axios = require("axios");

const UNSPLASH_API_KEY = "TKwNF_gHeB4Z6ieR6sV_Q8gIkQW_VFOcmiNfD0AX0uM"; // Your Access Key

cmd({
    pattern: "img",
    alias: ["image", "searchimg"],
    react: "🫧",
    desc: "Search and download images from Unsplash",
    category: "fun",
    use: ".img <keywords> [number_of_images]",
    filename: __filename
}, async (conn, mek, m, { reply, args, from }) => {
    try {
        if (!args.length) 
            return reply("🖼️ Please provide a search query\nExample: .img cute cats 3");

        // Determine count of images
        let count = parseInt(args[args.length - 1]);
        if (isNaN(count)) count = 3; // Default 3 images

        const query = args.slice(0, isNaN(args[args.length - 1]) ? args.length : -1).join(" ");

        await reply(`🔍 Searching Unsplash for "${query}"...`);

        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&client_id=${UNSPLASH_API_KEY}`;
        const { data } = await axios.get(url);

        if (!data.results || !data.results.length) 
            return reply("❌ No images found. Try different keywords");

        // Randomize results
        const selectedImages = data.results.sort(() => 0.5 - Math.random()).slice(0, count);

        for (const image of selectedImages) {
            await conn.sendMessage(
                from,
                {
                    image: { url: image.urls.regular },
                    caption: `*📷 Result for*: ${query}\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ*`
                },
                { quoted: mek }
            );
            await new Promise(resolve => setTimeout(resolve, 1000)); // Avoid rate limit
        }

    } catch (error) {
        console.error("Image Search Error:", error);
        reply(`❌ Error fetching images: ${error.message || "Unknown error"}`);
    }
});
