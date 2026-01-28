import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const MAX_FILE_SIZE_MB = 200;

/* Upload to catbox */
async function uploadMedia(buffer) {
  const type = await fileTypeFromBuffer(buffer);
  const ext = type?.ext || 'bin';

  const form = new FormData();
  form.append('fileToUpload', buffer, `file.${ext}`);
  form.append('reqtype', 'fileupload');

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  return await res.text();
}

/* Main command */
const tourl = async (m, bot) => {
  const prefix = /^[\\/!#.]/.test(m.body) ? m.body[0] : '.';
  const cmd = m.body.slice(prefix.length).split(' ')[0].toLowerCase();

  if (!['tourl', 'geturl', 'upload', 'url'].includes(cmd)) return;

  if (!m.quoted || !['imageMessage', 'videoMessage', 'audioMessage'].includes(m.quoted.mtype)) {
    return m.reply(`Reply to an image, video, or audio\nExample: *${prefix + cmd}*`);
  }

  try {
    const loading = await bot.sendMessage(
      m.from,
      { text: '⏳ Uploading media, please wait...' },
      { quoted: m }
    );

    const buffer = await m.quoted.download();
    if (!buffer) throw new Error('Download failed');

    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return bot.sendMessage(
        m.from,
        { text: `❌ File too large (max ${MAX_FILE_SIZE_MB}MB)` },
        { quoted: m }
      );
    }

    const url = await uploadMedia(buffer);

    const type = getMediaType(m.quoted.mtype);

    /* Edit loading message → result */
    await bot.sendMessage(m.from, {
      text:
`✅ *Upload Complete*

🔗 *URL:*
${url}

📦 *Type:* ${type.toUpperCase()}
👤 *User:* ${m.pushName}`,
      edit: loading.key
    });

  } catch (err) {
    console.error(err);
    m.reply('❌ Failed to upload media.');
  }
};

/* Media type helper */
const getMediaType = (mtype) => {
  if (mtype === 'imageMessage') return 'image';
  if (mtype === 'videoMessage') return 'video';
  if (mtype === 'audioMessage') return 'audio';
  return 'file';
};

export default tourl;
