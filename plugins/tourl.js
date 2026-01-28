import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';
import config from '../config.cjs';

const urlCommand = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (!['url', 'tourl', 'upload'].includes(cmd)) return;

  try {
    const quotedMsg = m.quoted ? m.quoted : m;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

    if (!mimeType) {
      return m.reply("*⚠️ Please reply to an image, video, or audio file*");
    }

    // Downloading media
    const mediaBuffer = await quotedMsg.download();
    
    // Size formatting logic
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Prepare temp file for upload
    const extension = mimeType.split('/')[1] || 'bin';
    const tempFilePath = path.join(os.tmpdir(), `catbox_${Date.now()}.${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    const form = new FormData();
    form.append('fileToUpload', fs.createReadStream(tempFilePath));
    form.append('reqtype', 'fileupload');

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: { ...form.getHeaders() }
    });

    // Cleanup
    fs.unlinkSync(tempFilePath);

    const mediaUrl = response.data;
    const timestamp = new Date().toLocaleString();
    const mediaType = mimeType.split('/')[0].toUpperCase();

    const responseText = `╭━━「 *𝐔𝐑𝐋 𝐆𝐄𝐍𝐄𝐑𝐀𝐓𝐎𝐑* 」
┃ ◈ *ꜱɪᴢᴇ:* ${formatBytes(mediaBuffer.length)}
┃ ◈ *ᴛɪᴍᴇ:* ${timestamp}
┃ ◈ *ᴍᴇᴅɪᴀ:* ${mediaType}
┃ ◈ *ᴜʀʟ:* ${mediaUrl}
╰━━━━━━━━━━━━━━━━━━❍
> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ-xᴍᴅ*`;

    await Matrix.sendMessage(m.from, {
      image: { url: mediaUrl }, // Shows the uploaded image as the message body
      caption: responseText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: "POPKID-XMD",
          serverMessageId: 143
        }
      }
    }, { quoted: m });

  } catch (error) {
    console.error(error);
    m.reply(`*❌ Error:* ${error.message}`);
  }
};

export default urlCommand;
