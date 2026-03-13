import axios from 'axios';
import fs from 'fs';
import config from '../config.cjs';

const videoCmd = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const args = body.split(" ").slice(1);
  const q = args.join(" ");
  
  const cmdName = body.startsWith(prefix) 
    ? body.slice(prefix.length).split(" ")[0].toLowerCase() 
    : "";
    
  if (!["video", "video", "mp4"].includes(cmdName)) return;

  try {
    if (!q) return m.reply("❓ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠɪᴅᴇᴏ ɴᴀᴍᴇ ᴏʀ ʟɪɴᴋ.*");

    // Reaction for "Processing"
    await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

    // Function to fetch branding image
    const getMenuImage = async () => {
      if (config.MENU_IMAGE && config.MENU_IMAGE.trim() !== '') {
        try {
          const response = await axios.get(config.MENU_IMAGE, { responseType: 'arraybuffer' });
          return Buffer.from(response.data, 'binary');
        } catch (error) {
          return fs.readFileSync('./media/zenor.jpeg');
        }
      } else {
        return fs.readFileSync('./media/zenor.jpeg');
      }
    };

    // 1. Search for Video Metadata (using Vreden for details)
    const searchUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
    const searchRes = await axios.get(searchUrl);
    
    if (!searchRes.data.status || !searchRes.data.result.metadata) {
        await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
        return m.reply("❌ *ᴠɪᴅᴇᴏ ɴᴏᴛ ꜰᴏᴜɴᴅ.*");
    }

    const meta = searchRes.data.result.metadata;
    const menuImage = await getMenuImage();

    // 2. Stylish Metadata Message (Ping Style)
    const videoStatus = `*ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴠɪᴅᴇᴏ* 🎬\n\n` +
                        `📌 *ᴛɪᴛʟᴇ:* ${meta.title}\n` +
                        `🕒 *ᴅᴜʀᴀᴛɪᴏɴ:* ${meta.timestamp}\n` +
                        `👤 *ᴄʜᴀɴɴᴇʟ:* ${meta.author.name}\n\n` +
                        `_ᴜᴘʟᴏᴀᴅɪɴɢ ʏᴏᴜʀ ᴠɪᴅᴇᴏ ꜰɪʟᴇ..._ 🚀`;

    await Matrix.sendMessage(m.from, {
        image: menuImage,
        caption: videoStatus,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363289379419860@newsletter',
                newsletterName: "ᴘᴏᴘᴋɪᴅ ᴜᴘᴅᴀᴛᴇs",
                serverMessageId: 143
            },
            externalAdReply: {
                title: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴠɪᴅᴇᴏ ᴘʟᴀʏᴇʀ",
                body: `ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ: ${meta.title}`,
                thumbnailUrl: meta.thumbnail || "https://files.catbox.moe/yr339d.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });

    // 3. Get Video Download Link from Elite API
    const eliteApiUrl = `https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(meta.url)}`;
    const downloadRes = await axios.get(eliteApiUrl);
    
    // Note: The API response uses .result.download for the video URL
    const finalVideoUrl = downloadRes.data.result?.download;

    if (finalVideoUrl && finalVideoUrl.startsWith('http')) {
        // 4. Send Video File
        await Matrix.sendMessage(m.from, { 
            video: { url: finalVideoUrl }, 
            caption: `*${meta.title}*\n\n_ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴏᴘᴇʀᴀᴛɪᴏɴᴀʟ_`,
            mimetype: 'video/mp4'
        }, { quoted: m });
        
        await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });
    } else {
        throw new Error("Invalid Video URL");
    }

  } catch (err) {
    console.error("VIDEO ERROR:", err);
    await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
    m.reply("⚠️ *ᴇʀʀᴏʀ:* sʏsᴛᴇᴍ ᴄʜᴇᴄᴋ ꜰᴀɪʟᴇᴅ.");
  }
};

export default videoCmd;
