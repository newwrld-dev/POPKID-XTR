import config from '../../config.cjs';
import axios from 'axios';

const apkDownloader = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || '';
  if (!body.startsWith(prefix)) return;
  
  const cmd = body.slice(prefix.length).split(' ')[0].toLowerCase();
  const text = body.slice(prefix.length + cmd.length).trim();

  if (cmd === "app" || cmd === "apk") {
    if (!text) return Matrix.sendMessage(m.from, { text: `*❌ ǫᴜᴇʀʏ?*` }, { quoted: m });

    await Matrix.sendMessage(m.from, { react: { text: "📥", key: m.key } });

    try {
      // Direct API call for speed
      const res = await axios.get(`http://ws75.aptoide.com/api/7/apps/search/query=${text}/limit=1`);
      const app = res.data?.datalist?.list[0];

      if (!app) return Matrix.sendMessage(m.from, { text: "⚠️ *ɴᴏᴛ ꜰᴏᴜɴᴅ.*" }, { quoted: m });

      const appSize = (app.size / 1048576).toFixed(2);

      const dashboard = `
╭––––––『 *ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴀᴘᴋ* 』––––––
┆ 📦 *ɴᴀᴍᴇ* : ${app.name}
┆ 🏋 *sɪᴢᴇ* : ${appSize} ᴍʙ
┆ 📅 *ᴜᴘᴅᴀᴛᴇᴅ* : ${app.updated}
╰–––––––––––––––––––––––––●`.trim();

      // Send info and file simultaneously (Async)
      Matrix.sendMessage(m.from, { 
        image: { url: app.icon },
        caption: dashboard,
        contextInfo: {
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363289379419860@newsletter',
            newsletterName: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴀᴘᴘs"
          }
        }
      }, { quoted: m });

      return Matrix.sendMessage(m.from, {
        document: { url: app.file.path_alt },
        fileName: `${app.name}.apk`,
        mimetype: "application/vnd.android.package-archive"
      }, { quoted: m });

    } catch (e) {
      return Matrix.sendMessage(m.from, { text: "❌ *ᴇʀʀᴏʀ.*" }, { quoted: m });
    }
  }
}

export default apkDownloader;
