import axios from 'axios';
import config from '../config.cjs';

const apk = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const body = m.body || "";
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase();
    const query = args.join(" ");

    if (!['apk', 'app'].includes(cmd)) return;

    if (!query) {
      return Matrix.sendMessage(
        m.from,
        { text: "❌ *Usage:* `.apk whatsapp`" },
        { quoted: m }
      );
    }

    // React loading
    await Matrix.sendMessage(m.from, {
      react: { text: "⏳", key: m.key }
    });

    const apiUrl = `https://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;

    const res = await axios.get(apiUrl, {
      timeout: 10000,
      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 2 * 1024 * 1024
    });

    const app = res?.data?.datalist?.list?.[0];
    if (!app || !app.file?.path) {
      await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
      return Matrix.sendMessage(
        m.from,
        { text: "⚠️ *No APK found.*" },
        { quoted: m }
      );
    }

    const sizeMB = (app.size / 1048576).toFixed(2);

    // HARD WhatsApp-safe limit
    if (parseFloat(sizeMB) > 120) {
      await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
      return Matrix.sendMessage(
        m.from,
        {
          text: `❌ *APK too large (${sizeMB} MB)*\nWhatsApp limit is 120MB.\nTry Lite version.`
        },
        { quoted: m }
      );
    }

    const safeName = app.name.replace(/[^\w\s-]/g, '').trim();
    const updated = new Date(app.updated * 1000).toLocaleDateString();

    // Info box
    const info = `╭───⟪ *APK Downloader* ⟫
┃ 📦 *Name:* ${safeName}
┃ 🏋 *Size:* ${sizeMB} MB
┃ 🏷 *Package:* ${app.package}
┃ 📅 *Updated:* ${updated}
╰────────────────────
🔗 *Powered by Popkid*`;

    await Matrix.sendMessage(m.from, { text: info }, { quoted: m });

    // Small delay = CPU + RAM safety
    await new Promise(r => setTimeout(r, 1500));

    // Send APK file
    await Matrix.sendMessage(
      m.from,
      {
        document: { url: app.file.path },
        mimetype: "application/vnd.android.package-archive",
        fileName: `${safeName}.apk`,
        caption: `✅ *${safeName}* downloaded successfully`
      },
      { quoted: m }
    );

    // Success react
    await Matrix.sendMessage(m.from, {
      react: { text: "✅", key: m.key }
    });

  } catch (err) {
    console.error("APK COMMAND ERROR:", err?.message);

    await Matrix.sendMessage(m.from, {
      react: { text: "❌", key: m.key }
    });

    await Matrix.sendMessage(
      m.from,
      { text: "❌ *Server busy or memory limit reached. Try again later.*" },
      { quoted: m }
    );
  }
};

export default apk;
