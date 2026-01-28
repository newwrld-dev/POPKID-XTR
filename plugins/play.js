import axios from 'axios';
import yts from 'yt-search';

const BASE_URL = 'https://noobs-api.top';

// Stylish Typing/Loading Effect
const delayTyping = async (Matrix, jid) => {
  await Matrix.sendPresenceUpdate('composing', jid);
  await new Promise(resolve => setTimeout(resolve, 800));
};

const handleMediaCommand = async (m, Matrix, format = 'mp3') => {
  const prefix = '.';
  const body = m.body || '';
  const command = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = body.slice(prefix.length + command.length).trim();
  const from = m.from;

  if (!text) {
    return Matrix.sendMessage(from, {
      text: `*❌ ᴍɪssɪɴɢ ǫᴜᴇʀʏ*\n\n*📌 ᴜsᴀɢᴇ:* \`${prefix}${command} <sᴏɴɢ ɴᴀᴍᴇ>\`\n*✨ ᴇxᴀᴍᴘʟᴇ:* \`${prefix}${command} Alan Walker Faded\``
    }, { quoted: m });
  }

  try {
    // 1. React & Show Processing
    await Matrix.sendMessage(from, { react: { text: '📥', key: m.key } });
    await delayTyping(Matrix, from);

    // 2. Search Video
    const search = await yts(text);
    const video = search.videos[0];

    if (!video) {
      return Matrix.sendMessage(from, { text: '⚠️ *ɴᴏ ʀᴇsᴜʟᴛs ꜰᴏᴜɴᴅ.* ᴛʀʏ ᴀɴᴏᴛʜᴇʀ ᴋᴇʏᴡᴏʀᴅ.' }, { quoted: m });
    }

    // 3. Get Download Link
    const videoId = video.videoId;
    const apiUrl = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=${format}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    if (!data.downloadLink) {
      return Matrix.sendMessage(from, { text: '❌ *ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ.* ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.' }, { quoted: m });
    }

    const fileName = `${video.title.replace(/[\\/:*?"<>|]/g, '')}.${format}`;

    // 4. Ultra-Stylish Dashboard Caption
    const caption = `
╭––––––『 *ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏ* 』––––––
┆
┆ 🏷️ *ᴛɪᴛʟᴇ* : ${video.title}
┆ 👤 *ᴀʀᴛɪsᴛ* : ${video.author.name}
┆ ⏱️ *ᴅᴜʀᴀᴛɪᴏɴ* : ${video.timestamp}
┆ 📅 *ᴘᴜʙʟɪsʜᴇᴅ* : ${video.ago}
┆ 👁️ *ᴠɪᴇᴡs* : ${video.views.toLocaleString()}
┆ 📥 *ꜰᴏʀᴍᴀᴛ* : ${format.toUpperCase()}
┆
╰–––––––––––––––––––––––––●

> ✅ *ʀᴇᴀᴅʏ ᴛᴏ ᴜᴘʟᴏᴀᴅ...*
    `.trim();

    // 5. Send Thumbnail with Newsletter Style Forwarding
    await Matrix.sendMessage(from, {
      image: { url: video.thumbnail },
      caption,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴜᴘᴅᴀᴛᴇs",
          serverMessageId: 143
        },
        externalAdReply: {
          title: "🎧 ᴘᴏᴘᴋɪᴅ ᴍᴜsɪᴄ ᴘʟᴀʏᴇʀ",
          body: `ɴᴏᴡ ᴘʟᴀʏɪɴɢ: ${video.title}`,
          thumbnailUrl: video.thumbnail,
          sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
          mediaType: 1,
          showAdAttribution: true,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

    // 6. Send Audio/Video with Advanced Meta
    if (format === 'mp3') {
      await Matrix.sendMessage(from, {
        audio: { url: data.downloadLink },
        mimetype: 'audio/mpeg',
        fileName: fileName,
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: video.author.name,
            thumbnailUrl: video.thumbnail,
            mediaType: 2,
            mediaUrl: video.url
          }
        }
      }, { quoted: m });
    } else {
      await Matrix.sendMessage(from, {
        video: { url: data.downloadLink },
        mimetype: 'video/mp4',
        fileName: fileName,
        caption: `*✨ sᴜᴄᴄᴇssꜰᴜʟʟʏ ᴘʀᴏᴄᴇssᴇᴅ*`,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363289379419860@newsletter',
            newsletterName: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴠɪᴅᴇᴏ",
            serverMessageId: 143
          }
        }
      }, { quoted: m });
    }

    await Matrix.sendMessage(from, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error(`[DOWNLOAD ERROR]:`, err.message);
    await Matrix.sendMessage(from, { text: `❌ *ᴇʀʀᴏʀ:* ${err.message}` }, { quoted: m });
  }
};

const mediaHandler = async (m, Matrix) => {
  const prefix = '.';
  const body = m.body || '';
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  switch (cmd) {
    case 'play':
    case 'music':
    case 'song':
    case 'mp3':
      return handleMediaCommand(m, Matrix, 'mp3');

    case 'video':
    case 'vid':
    case 'mp4':
      return handleMediaCommand(m, Matrix, 'mp4');
  }
};

export const aliases = ['play', 'music', 'song', 'video', 'vid', 'mp4', 'mp3'];
export default mediaHandler;
