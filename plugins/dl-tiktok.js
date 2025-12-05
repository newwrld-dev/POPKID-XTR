const { cmd } = require("../command");
const axios = require("axios");

// VERIFIED CONTACT (Same as popkids menu)
const verifiedContact = {
    key: {
        fromMe: false,
        participant: `0@s.whatsapp.net`,
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "POP KIDS VERIFIED ✅",
            vcard: `BEGIN:VCARD
VERSION:3.0
FN:POP KIDS VERIFIED
ORG:POP KIDS BOT;
TEL;type=CELL;type=VOICE;waid:${config.OWNER_NUMBER || "0000000000"}:+${config.OWNER_NUMBER || "0000000000"}
END:VCARD`
        }
    }
};

cmd(
{
    pattern: "tiktok",
    alias: ["ttdl", "tt", "tiktokdl"],
    desc: "Download TikTok video without watermark",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {

        // Validate input
        if (!q) return reply("Please provide a TikTok video link.");
        if (!q.includes("tiktok.com"))
            return reply("Invalid TikTok link.");

        await conn.sendMessage(from, {
            text: "⬇️ Downloading video, please wait...",
        }, { quoted: verifiedContact });

        // API call
        const apiURL = `https://delirius-apiofc.vercel.app/download/tiktok?url=${q}`;
        const { data } = await axios.get(apiURL);

        if (!data.status || !data.data)
            return reply("Failed to fetch TikTok video.");

        // Extract Data
        const {
            title,
            like,
            comment,
            share,
            author,
            meta
        } = data.data;

        const videoUrl = meta.media.find(m => m.type === "video").org;

        // Caption
        const caption =
`🎵 *TikTok Video* 🎵

👤 *User:* ${author.nickname} (@${author.username})
📖 *Title:* ${title}
👍 *Likes:* ${like}
💬 *Comments:* ${comment}
🔁 *Shares:* ${share}`;

        // Send video
        await conn.sendMessage(
            from,
            {
                video: { url: videoUrl },
                caption,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289379419860@newsletter",
                        newsletterName: "POP KIDS TIKTOK",
                        serverMessageId: 143
                    }
                }
            },
            { quoted: verifiedContact }
        );

    } catch (err) {

        console.error("Error in TikTok downloader:", err);
        reply("An error occurred: " + err.message);

    }
});
