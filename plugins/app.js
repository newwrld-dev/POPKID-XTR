import axios from 'axios';
import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import config from '../config.cjs';

const apk = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (!['apk', 'aptoide'].includes(cmd)) return;
  if (!text) return Matrix.sendMessage(m.from, { text: `❌ Please provide an app name!\nUsage: ${prefix}${cmd} <app name>` }, { quoted: m });

  try {
    const sanitizedQuery = text.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(sanitizedQuery)}/limit=1`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || !data.list || !data.list.length) {
      return Matrix.sendMessage(m.from, { text: `❌ No results found for "${text}"` }, { quoted: m });
    }

    const app = data.list[0];
    if (!app.link) {
      return Matrix.sendMessage(m.from, { text: `❌ APK download link not available for "${app.name}"` }, { quoted: m });
    }

    // Fetch APK file
    const apkResponse = await axios.get(app.link, { responseType: 'arraybuffer' });
    const apkBuffer = Buffer.from(apkResponse.data);

    // Optional: save temporarily
    const tempFile = `./temp_${app.name.replace(/\s/g, '_')}.apk`;
    await writeFile(tempFile, apkBuffer);

    // Send as file
    await Matrix.sendMessage(m.from, {
      document: fs.readFileSync(tempFile),
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${app.name}.apk`,
      caption: `📱 *App Name:* ${app.name}\n📥 *Downloads:* ${app.downloads || 'N/A'}\n⭐ *Rating:* ${app.star || 'N/A'}\n📝 *Description:* ${app.description || 'No description available'}`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: "POPKID-XMD",
          serverMessageId: 200
        }
      }
    }, { quoted: m });

    // Clean up temp file
    await unlink(tempFile);

  } catch (err) {
    console.error(err);
    await Matrix.sendMessage(m.from, { text: `❌ Error fetching APK for "${text}"` }, { quoted: m });
  }
};

export default apk;
