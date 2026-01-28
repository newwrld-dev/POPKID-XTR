import axios from 'axios';
import config from '../config.cjs';

const apk = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = body.slice(prefix.length + cmd.length).trim();

  if (!['apk', 'aptoide'].includes(cmd)) return;
  if (!text) return Matrix.sendMessage(m.from, { text: "❌ *Please provide an app name.*" }, { quoted: m });

  await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

  try {
    const apiUrl = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(text)}/limit=1`;
    const response = await axios.get(apiUrl);
    const app = response.data?.datalist?.list?.[0];

    if (!app) {
      await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
      return Matrix.sendMessage(m.from, { text: "⚠️ *No results found.*" }, { quoted: m });
    }

    const appSize = (app.size / 1048576).toFixed(2);
    
    // 100MB Safety Guard to prevent WhatsApp internal errors
    if (parseFloat(appSize) > 150) {
        return Matrix.sendMessage(m.from, { text: `❌ *File too large (${appSize}MB).* WhatsApp limit is 150MB.` }, { quoted: m });
    }

    const box = `╭─────⟪ *APK Downloader* ⟫─
┃ 📦 *Name:* ${app.name}
┃ 🏋 *Size:* ${appSize} MB
┃ 🏷 *Package:* ${app.package}
┃ 📅 *Updated:* ${app.updated}
╰─────────────────────
🔗 *Powered By Popkid*`;

    await Matrix.sendMessage(m.from, { text: box }, { quoted: m });

    // CRITICAL: We send the URL directly. This prevents the "Out of Memory" crash.
    await Matrix.sendMessage(m.from, {
      document: { url: app.file.path }, 
      fileName: `${app.name}.apk`,
      mimetype: "application/vnd.android.package-archive",
      caption: `✅ *${app.name}* Downloaded Successfully.`
    }, { quoted: m });

    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (err) {
    console.error("APK Error:", err.message);
    await Matrix.sendMessage(m.from, { text: "❌ *Server Error:* Request was too heavy." }, { quoted: m });
  }
};

export default apk;
