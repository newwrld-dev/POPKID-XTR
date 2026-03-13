import axios from 'axios';
import fs from 'fs';
import config from '../config.cjs';

const play2Cmd = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const args = body.split(" ").slice(1);
  const q = args.join(" ");
  
  const cmdName = body.startsWith(prefix) 
    ? body.slice(prefix.length).split(" ")[0].toLowerCase() 
    : "";
    
  if (!["play", "song", "audio"].includes(cmdName)) return;

  try {
    if (!q) return m.reply("❓ *ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ sᴏɴɢ ɴᴀᴍᴇ ᴏʀ ʟɪɴᴋ.*");

    // Reaction for "Processing"
    await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

    // Function to fetch image exactly like your ping script
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

    // 1. Get Metadata from Search
    const searchUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(q)}`;
    const searchRes = await axios.get(searchUrl);
    
    if (!searchRes.data.status || !searchRes.data.result.metadata) {
        await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
        return m.reply("❌ *ᴄᴏᴜʟᴅ ɴᴏᴛ ꜰɪɴᴅ ᴛʜᴇ sᴏɴɢ.*");
    }

    const meta = searchRes.data.result.metadata;
    const menuImage = await getMenuImage();

    // 2. Stylish Metadata Message (Ping Style)
    const playStatus = `*ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ* 🎶\n\n` +
                       `📌 *ᴛɪᴛʟᴇ:* ${meta.title}\n` +
                       `🕒 *ᴅᴜʀᴀᴛɪᴏɴ:* ${meta.timestamp}\n` +
                       `👤 *ᴄʜᴀɴɴᴇʟ:* ${meta.author.name}\n\n` +
                       `_ꜰᴇᴛᴄʜɪɴɢ ʏᴏᴜʀ ᴀᴜᴅɪᴏ ꜰɪʟᴇ..._ ⚡`;

    await Matrix.sendMessage(m.from, {
        image: menuImage,
        caption: playStatus,
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
                title: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ",
                body: `ɴᴏᴡ ᴘʟᴀʏɪɴɢ: ${meta.title}`,
                thumbnailUrl: meta.thumbnail || "https://files.catbox.moe/yr339d.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });

    // 3. Get Download Link from Elite API
    const eliteApiUrl = `https://eliteprotech-apis.zone.id/ytmp3?url=${encodeURIComponent(meta.url)}`;
    const downloadRes = await axios.get(eliteApiUrl);
    const finalAudioUrl = downloadRes.data.result?.download;

    if (finalAudioUrl && finalAudioUrl.startsWith('http')) {
        // 4. Send Audio
        await Matrix.sendMessage(m.from, { 
            audio: { url: finalAudioUrl }, 
            mimetype: 'audio/mpeg',
            fileName: `${meta.title}.mp3`
        }, { quoted: m });
        
        await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });
    } else {
        throw new Error("Invalid Download URL");
    }

  } catch (err) {
    console.error("PLAY ERROR:", err);
    await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
    m.reply("⚠️ *ᴇʀʀᴏʀ:* sʏsᴛᴇᴍ ᴄʜᴇᴄᴋ ꜰᴀɪʟᴇᴅ.");
  }
};

export default play2Cmd;
