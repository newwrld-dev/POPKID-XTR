const { cmd } = require("../command");
const axios = require("axios");
const config = require("../config");

// Temporary storage for reply states
const igSession = {};

cmd({
    pattern: "ig",
    alias: ["instagram", "igdl", "insta"],
    desc: "Download Instagram videos",
    category: "download",
    react: "📸",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {

    try {
        const igUrl = q && q.trim();
        if (!igUrl) return reply("Please send an Instagram video link!");
        if (!igUrl.includes("instagram.com")) return reply("Not a valid Instagram link.");

        const apiUrl = `https://apis-keith.vercel.app/download/instagramdl?url=${encodeURIComponent(igUrl)}`;
        const response = await axios.get(apiUrl);

        const data = response.data;
        if (!data.status || !data.result?.downloadUrl)
            return reply("Failed to fetch. Post may be private.");

        const downloadUrl = data.result.downloadUrl;
        const caption = `
*${config.BOT || 'Instagram Downloader'}*
📸 *Choose an option below:*

1️⃣ Play Video  
2️⃣ Download Video  
3️⃣ Extract Audio  
4️⃣ Audio as Document  
`;

        // Send menu message
        const sent = await conn.sendMessage(from, {
            text: caption,
        }, { quoted: mek });

        // Save session
        igSession[sent.key.id] = {
            downloadUrl,
            chat: from,
            user: mek.sender
        };

    } catch (err) {
        reply(`Error: ${err.message}`);
    }
});


// Global listener (placed once)
module.exports = async (conn) => {
    conn.ev.on("messages.upsert", async update => {
        const msg = update.messages[0];
        if (!msg.message?.extendedTextMessage) return;

        const text = msg.message.extendedTextMessage.text.trim();
        const repliedTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;

        if (!igSession[repliedTo]) return; // Not our menu

        const { downloadUrl, chat, user } = igSession[repliedTo];

        if (msg.sender !== user) return; // Ensure same user responds

        delete igSession[repliedTo]; // Clear state

        await conn.sendMessage(chat, { react: { text: "⏳", key: msg.key } });

        switch (text) {

            case "1":
                await conn.sendMessage(chat, {
                    video: { url: downloadUrl },
                    caption: "*Playing Video...*"
                }, { quoted: msg });
                break;

            case "2":
                await conn.sendMessage(chat, {
                    document: { url: downloadUrl },
                    mimetype: "video/mp4",
                    fileName: `Instagram_${Date.now()}.mp4`
                }, { quoted: msg });
                break;

            case "3":
                await conn.sendMessage(chat, {
                    audio: { url: downloadUrl },
                    mimetype: "audio/mpeg"
                }, { quoted: msg });
                break;

            case "4":
                await conn.sendMessage(chat, {
                    document: { url: downloadUrl },
                    mimetype: "audio/mpeg",
                    fileName: `Instagram_${Date.now()}.mp3`
                }, { quoted: msg });
                break;

            default:
                await conn.sendMessage(chat, {
                    text: "❌ Choose only *1-4*."
                }, { quoted: msg });
        }

        await conn.sendMessage(chat, { react: { text: "✅", key: msg.key } });
    });
};
