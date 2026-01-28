import axios from 'axios';
import config from '../config.cjs';

// Helper to prevent WhatsApp rate-limit bans
const delay = ms => new Promise(res => setTimeout(res, ms));

const apk = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = body.slice(prefix.length + cmd.length).trim();

  if (!['apk', 'aptoide'].includes(cmd)) return;

  if (!text) {
    return Matrix.sendMessage(m.from, { text: "❌ *Please provide an app name to search.*" }, { quoted: m });
  }

  // 1. Initial Reaction
  await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

  try {
    // Correct API Endpoint from your screenshot
    const apiUrl = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(text)}/limit=1`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    // Fixed path: API returns 'datalist.list'
    const app = data.datalist?.list?.[0];

    if (!app) {
      await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
      return Matrix.sendMessage(m.from, { text: "⚠️ *No results found for the given app name.*" }, { quoted: m });
    }

    const appSize = (app.size / 1048576).toFixed(2); // Convert bytes to MB

    const box = `
╭─────⟪ *APK Downloader* ⟫─
┃ 📦 *Name:* ${app.name}
┃ 🏋 *Size:* ${appSize} MB
┃ 🏷 *Package:* ${app.package}
┃ 📅 *Updated:* ${app.updated}
╰─────────────────────
🔗 *Powered By Popkid*`;

    // 2. Send Info Box
    await Matrix.sendMessage(m.from, { text: box }, { quoted: m });

    // 3. Prevent 'rate-overlimit' with a small pause
    await delay(2000);

    // 4. Send the APK file using the direct path from the API
    await Matrix.sendMessage(m.from, {
      document: { url: app.file.path }, // Using path directly avoids disk usage issues
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: `✅ *${app.name}* is ready!`
    }, { quoted: m });

    // 5. Success Reaction
    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (err) {
    console.error("APK Error:", err.message);
    await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
    await Matrix.sendMessage(m.from, { text: `❌ *Error:* ${err.message}` }, { quoted: m });
  }
};

export default apk;
