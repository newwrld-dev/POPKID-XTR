import axios from 'axios';
import config from '../config.cjs';

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

  // Start the reaction (User Feedback)
  await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

  try {
    // Using the more reliable Aptoide API v7 endpoint
    const searchUrl = `https://api.aptoide.com/api/7/apps/search?query=${encodeURIComponent(text)}&limit=1`;
    const response = await axios.get(searchUrl);
    const data = response.data;

    // Correcting the path to access the app data
    const app = data.datalist?.list?.[0];

    if (!app) {
      await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
      return Matrix.sendMessage(m.from, { text: "⚠️ *No results found for the given app name.*" }, { quoted: m });
    }

    const appSize = (app.size / 1048576).toFixed(2); // Convert bytes to MB

    // Your Compact and Attractive Box
    const box = `
╭─────⟪ *APK Downloader* ⟫─
┃ 📦 *Name:* ${app.name}
┃ 🏋 *Size:* ${appSize} MB
┃ 🏷 *Package:* ${app.package}
┃ 📅 *Updated:* ${app.updated}
╰─────────────────────
🔗 *Powered By Popkid*`;

    // Send the information box
    await Matrix.sendMessage(m.from, { text: box }, { quoted: m });

    // 1.5 second delay to prevent 'rate-overlimit' before sending heavy file
    await delay(1500);

    // Send the APK file directly from the URL (Saves Disk Space)
    await Matrix.sendMessage(m.from, {
      document: { url: app.file.path }, // Using path for direct download
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: `*${app.name}* successfully downloaded.`
    }, { quoted: m });

    // Final success reaction
    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (err) {
    console.error("APK Error:", err.message);
    await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
    await Matrix.sendMessage(m.from, { text: "❌ *Error:* Could not process your request." }, { quoted: m });
  }
};

export default apk;
