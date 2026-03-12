import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const playCmd = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const args = body.split(" ");
  const cmd = body.startsWith(prefix) ? args[0].slice(prefix.length).toLowerCase() : "";
  const query = args.slice(1).join(" ");

  if (cmd !== "play" && cmd !== "song") return;

  if (!query) {
    return m.reply(`*ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ*\n\nEx: ${prefix}play Shape of You`);
  }

  try {
    // 1. React to show processing
    await Matrix.sendMessage(m.from, { react: { text: "⏳", key: m.key } });

    // 2. Search YouTube
    const search = await yts(query);
    const video = search.videos[0];
    if (!video) return m.reply("❌ No results found.");

    // 3. Define Context Info (Matching your Ping Style)
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
        title: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴍᴜsɪᴄ",
        body: `ɴᴏᴡ ᴘʟᴀʏɪɴɢ: ${video.title}`,
        thumbnailUrl: video.thumbnail,
        sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
        mediaType: 1,
        renderLargerThumbnail: false
      }
    };

    // 4. Send Thumbnail + Info (Caption style from your reference)
    const caption = `*🎶 ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ*\n\n` +
                    `╭───────────────◆\n` +
                    `│ 📑 *ᴛɪᴛʟᴇ:* ${video.title}\n` +
                    `│ ⏳ *ᴅᴜʀᴀᴛɪᴏɴ:* ${video.timestamp}\n` +
                    `│ 👤 *ᴀᴜᴛʜᴏʀ:* ${video.author.name}\n` +
                    `╰────────────────◆\n\n` +
                    `_⚡ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀᴜᴅɪᴏ..._`;

    await Matrix.sendMessage(m.from, {
      image: { url: video.thumbnail },
      caption: caption,
      contextInfo
    }, { quoted: m });

    // 5. Fetch Audio from API
    const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(video.url)}&format=mp3`;
    const { data } = await axios.get(apiURL);

    if (!data || !data.downloadLink) {
      return m.reply("⚠️ Failed to fetch download link from server.");
    }

    // 6. Send Audio File
    await Matrix.sendMessage(m.from, {
      audio: { url: data.downloadLink },
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`,
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴀᴜᴅɪᴏ",
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // 7. Final Success Reaction
    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("PLAY ERROR:", error);
    m.reply("⚠️ *Error:* Musical playback failed.");
  }
};

export default playCmd;
