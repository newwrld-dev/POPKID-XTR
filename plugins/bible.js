import axios from 'axios';
import config from '../config.cjs';

const bibleCommand = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "bible" && cmd !== "verse") return;

  try {
    const reference = body.slice(prefix.length + cmd.length).trim();

    if (!reference) {
      return m.reply("📖 *The Holy Bible*\n\n*Usage:* .bible [reference]\n*Example:* .bible John 3:16");
    }

    // Set "Composing" status for a thoughtful feel
    await gss.sendPresenceUpdate('composing', m.from);

    // Fetch from Bible API
    const apiUrl = `https://bible-api.com/${encodeURIComponent(reference)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    if (!res || !res.text) {
      return m.reply("☦️ *Scripture not found.* Please check your reference (e.g., Genesis 1:1).");
    }

    // Stylish Bible-themed formatting
    const holyMenu = `📜 *H O L Y  S C R I P T U R E* 📜\n` +
                     `━━━━━━━━━━━━━━━━━━━━\n\n` +
                     `📖 *Reference:* ${res.reference}\n` +
                     `🕊️ *Translation:* ${res.translation_name}\n\n` +
                     `“ ${res.text.trim()} ”\n\n` +
                     `━━━━━━━━━━━━━━━━━━━━\n` +
                     `✨ _“Thy word is a lamp unto my feet.”_ ✨`;

    // Send with a beautiful religious thumbnail
    await gss.sendMessage(m.from, { 
      text: holyMenu,
      contextInfo: {
        externalAdReply: {
          title: "Daily Bread: " + res.reference,
          body: "Read the Word of God",
          thumbnailUrl: "https://files.catbox.moe/67tq2b.jpg", // Stylish Bible image
          sourceUrl: "https://bible-api.com/",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

  } catch (error) {
    console.error("BIBLE CMD ERROR:", error);
    m.reply("⚠️ *Divine Connection Error:* The Bible server is currently unreachable.");
  }
};

export default bibleCommand;
