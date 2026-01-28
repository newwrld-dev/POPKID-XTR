import axios from 'axios';
import fs from 'fs';
import { writeFile, unlink } from 'fs/promises';
import config from '../config.cjs';

const apk = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = body.slice(prefix.length + cmd.length).trim();

  if (!['apk', 'aptoide'].includes(cmd)) return;
  if (!text) return Matrix.sendMessage(m.from, { text: `❌ Please provide an app name!\nUsage: ${prefix}${cmd} <app name>` }, { quoted: m });

  try {
    // 1. Better search endpoint
    const searchUrl = `https://api.aptoide.com/api/7/apps/search?query=${encodeURIComponent(text)}&limit=1`;
    const response = await axios.get(searchUrl);
    const data = response.data;

    // Check if data exists and has the 'datalist' structure
    const app = data.datalist?.list?.[0];

    if (!app) {
      return Matrix.sendMessage(m.from, { text: `❌ No results found for "${text}"` }, { quoted: m });
    }

    // 2. Inform the user you found it (User feedback is key!)
    await Matrix.sendMessage(m.from, { text: `📥 Downloading *${app.name}*... please wait.` }, { quoted: m });

    // 3. Use the 'file' link from the response
    const downloadUrl = app.file.path;
    const apkResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
    const apkBuffer = Buffer.from(apkResponse.data);

    const tempFile = `./${app.package}_${Date.now()}.apk`;
    await writeFile(tempFile, apkBuffer);

    // 4. Send Document
    await Matrix.sendMessage(m.from, {
      document: fs.readFileSync(tempFile),
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${app.name}.apk`,
      caption: `📱 *App:* ${app.name}\n📦 *Package:* ${app.package}\n⚖️ *Size:* ${(app.size / 1024 / 1024).toFixed(2)} MB`,
    }, { quoted: m });

    await unlink(tempFile);

  } catch (err) {
    console.error("APK Error:", err.message);
    await Matrix.sendMessage(m.from, { text: `❌ Error: Could not process the request for "${text}".` }, { quoted: m });
  }
};

export default apk;
