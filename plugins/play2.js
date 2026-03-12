import axios from 'axios';
import config from '../config.cjs';

const play2Cmd = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const args = body.split(" ");
  const cmd = body.startsWith(prefix) ? args[0].slice(prefix.length).toLowerCase() : "";
  const query = args.slice(1).join(" ");

  if (cmd !== "play2") return;

  if (!query) {
    return m.reply(`*ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ ᴠ2*\n\nEx: ${prefix}play2 Happy Nation`);
  }

  try {
    // 1. Initial Reaction
    await Matrix.sendMessage(m.from, { react: { text: "🎶", key: m.key } });

    // 2. Fetch data from Vreden Play API
    const apiUrl = `https://api.vreden.my.id/api/v1/download/play/audio?query=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.status || !data.result) {
      return m.reply("❌ No results found or API is down.");
    }

    const video = data.result.metadata;
    const downloadData = data.result.download;

    // 3. Define Popkid XMD Context Info (Ping Style)
    const contextInfo = {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363289379419860@newsletter',
        newsletterName: "ᴘᴏᴘᴋɪᴅ ᴜᴘᴅᴀᴛᴇs",
        serverMessageId: 143
      },
      externalAdReply: {
        title: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴍᴜsɪᴄ ᴠ2",
        body: `ɴᴏᴡ ᴘʟᴀʏɪɴɢ: ${video.title}`,
        thumbnailUrl: video.thumbnail,
        sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
        mediaType: 1,
        renderLargerThumbnail: false
      }
    };

    // 4. Send Information Message
    const caption = `*🎶 ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ ᴠ2*\n\n` +
                    `╭───────────────◆\n` +
                    `│ 📑 *ᴛɪᴛʟᴇ:* ${video.title}\n` +
                    `│ ⏳ *ᴅᴜʀᴀᴛɪᴏɴ:* ${video.timestamp}\n` +
                    `│ 👤 *ᴀᴜᴛʜᴏʀ:* ${video.author.name}\n` +
                    `│ 📅 *ᴘᴜʙʟɪsʜᴇᴅ:* ${video.ago}\n` +
                    `╰────────────────◆\n\n` +
                    `_⚡ ᴘʀᴇᴘᴀʀɪɴɢ ʏᴏᴜʀ ᴀᴜᴅɪᴏ..._`;

    await Matrix.sendMessage(m.from, {
      image: { url: video.thumbnail },
      caption: caption,
      contextInfo
    }, { quoted: m });

    // 5. Check if Vreden download is ready, else use fallback
    let finalUrl = downloadData.url;

    if (!downloadData.status || !finalUrl) {
      console.log("Vreden error detected, attempting fallback...");
      // Fallback to Noobs API if Vreden conversion fails
      const fallbackUrl = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(video.url)}&format=mp3`;
      const fbRes = await axios.get(fallbackUrl);
      if (fbRes.data && fbRes.data.downloadLink) {
        finalUrl = fbRes.data.downloadLink;
      } else {
        return m.reply("⚠️ *Error:* Both primary and fallback servers failed to convert this audio.");
      }
    }

    // 6. Send Audio File as Document (Ping style consistency)
    await Matrix.sendMessage(m.from, {
      document: { url: finalUrl },
      fileName: `${video.title}.mp3`,
      mimetype: "audio/mpeg",
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ",
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

    // 7. Success Reaction
    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("PLAY2 ERROR:", error);
    m.reply("⚠️ *Error:* System failed to process the request.");
    await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
  }
};

export default play2Cmd;
