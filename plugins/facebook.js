const { cmd } = require("../command");
const getFBInfo = require("@xaviabot/fb-downloader");
const config = require("../config");
const fs = require("fs");
const path = require("path");

// Quoted Contact Message (Popkids Verified)
const quotedContact = {
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
FN:POP KIDS VERIFIED ✅
ORG:POP KIDS BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

cmd({
    pattern: "fb",
    alias: ["facebook", "facebook1", "fb1"],
    desc: "Download Facebook videos/audios",
    category: "download",
    react: "📽️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const fbUrl = q && q.trim();
        if (!fbUrl) return reply("Please send a Facebook video link!");
        if (!fbUrl.includes("https://") || !fbUrl.includes("facebook.com"))
            return reply("Please send a valid Facebook video link.");

        const videoData = await getFBInfo(fbUrl);

        if (!videoData || !videoData.sd)
            return reply("Failed to fetch video. The link might be private or invalid.");

        const caption = `
*${config.BOT || 'Facebook Downloader'} Facebook Downloader*
|__________________________
|       *𝐓𝐈𝐓𝐋𝐄*  
       ${videoData.title || 'No title available'}
|_________________________
| REPLY WITH A NUMBER BELOW
|_________________________
|____  *𝐕𝐈𝐃𝐄𝐎*  ____
|-᳆  1. SD Quality
|-᳆  2. HD Quality
|_________________________
|____  *𝐀𝐔𝐃𝐈𝐎*  ____
|-᳆  3. Audio Only
|-᳆  4. As Document
|-᳆  5. As Voice Message
|__________________________|
`;

        const sentMsg = await conn.sendMessage(from, {
            image: { url: videoData.thumbnail || "" },
            caption,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363289379419860@newsletter",
                    newsletterName: "𝐩𝐨𝐩𝐤𝐢𝐝",
                    serverMessageId: Math.floor(100000 + Math.random() * 900000),
                }
            }
        }, { quoted: quotedContact }); // <-- Use verified contact here

        // Reply handler: listen for reply with option
        conn.ev.on("messages.upsert", async update => {
            const msg = update.messages[0];
            if (!msg.message?.extendedTextMessage) return;
            const text = msg.message.extendedTextMessage.text.trim();
            if (msg.message.extendedTextMessage.contextInfo?.stanzaId === sentMsg.key.id) {
                await conn.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

                switch (text) {
                    case "1":
                        await conn.sendMessage(from, {
                            video: { url: videoData.sd },
                            caption: `*${config.BOT || "Facebook Downloader"}* - SD Quality`
                        }, { quoted: msg });
                        break;
                    case "2":
                        if (videoData.hd) {
                            await conn.sendMessage(from, {
                                video: { url: videoData.hd },
                                caption: `*${config.BOT || "Facebook Downloader"}* - HD Quality`
                            }, { quoted: msg });
                        } else {
                            await conn.sendMessage(from, { text: "HD not available. Sending SD.", quoted: msg });
                            await conn.sendMessage(from, {
                                video: { url: videoData.sd },
                                caption: `*${config.BOT || "Facebook Downloader"}* - SD Quality`
                            }, { quoted: msg });
                        }
                        break;
                    case "3":
                        await conn.sendMessage(from, {
                            audio: { url: videoData.sd },
                            mimetype: "audio/mpeg",
                            caption: `*${config.BOT || "Facebook Downloader"}* - Audio`
                        }, { quoted: msg });
                        break;
                    case "4":
                        await conn.sendMessage(from, {
                            document: { url: videoData.sd },
                            mimetype: "video/mp4",
                            fileName: `${config.BOT || "Facebook"}_${Date.now()}.mp4`,
                            caption: `*${config.BOT || "Facebook Downloader"}* - Video Document`
                        }, { quoted: msg });
                        break;
                    case "5":
                        await conn.sendMessage(from, {
                            audio: { url: videoData.sd },
                            mimetype: "audio/ogg; codecs=opus",
                            ptt: true,
                            caption: `*${config.BOT || "Facebook Downloader"}* - Voice Message`
                        }, { quoted: msg });
                        break;
                    default:
                        await conn.sendMessage(from, { text: "Please choose a number (1-5) only." }, { quoted: msg });
                        break;
                }
                await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });
            }
        });

    } catch (error) {
        await reply(`Failed to download video. Error: ${error.message}\nTry another link or make sure the video is public.`);
    }
});
