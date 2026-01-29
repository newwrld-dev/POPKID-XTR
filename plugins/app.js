import axios from 'axios';
import config from '../config.cjs';

const apkDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "apk" && cmd !== "app") return;

  try {
    const packageName = body.slice(prefix.length + cmd.length).trim();

    if (!packageName) {
      return m.reply("📦 *Usage:* .apk [package name]\n*Example:* .apk com.whatsapp");
    }

    // Set "Typing" status for a human-like feel
    await gss.sendPresenceUpdate('composing', m.from);
    await m.reply("_⏳ Searching for the APK file, please wait..._");

    // Fetch data from the APK API
    const apiUrl = `https://api.bk9.dev/download/apk?id=${encodeURIComponent(packageName)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate the response structure
    if (!res || res.status !== true || !res.BK9?.dllink) {
      return m.reply("❌ *Error:* Could not find that application. Check the package name.");
    }

    const appData = res.BK9; //
    const caption = `✅ *APK FOUND*\n\n` +
                    `📱 *Name:* ${appData.name}\n` +
                    `📦 *Package:* ${appData.package}\n` +
                    `📅 *Updated:* ${appData.lastup}\n\n` +
                    `_🚀 Sending the file now..._`;

    // Send the app icon as a preview
    if (appData.icon) {
      await gss.sendMessage(m.from, { 
        image: { url: appData.icon }, 
        caption: caption 
      }, { quoted: m });
    }

    // Send the actual APK file
    await gss.sendMessage(m.from, {
      document: { url: appData.dllink },
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${appData.name}.apk`
    }, { quoted: m });

  } catch (error) {
    console.error("APK CMD ERROR:", error);
    m.reply("⚠️ *System Error:* The APK server is currently unresponsive.");
  }
};

export default apkDownload;
