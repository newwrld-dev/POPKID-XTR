import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const playCmd = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const args = body.split(" ");
  const cmd = body.startsWith(prefix) ? args[0].slice(prefix.length).toLowerCase() : "";
  const query = args.slice(1).join(" ");

  if (cmd !== "play2" && cmd !== "song2") return;

  if (!query) {
    return m.reply(`*ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ*\n\nEx: ${prefix}play nandy asante`);
  }

  try {
    await Matrix.sendMessage(m.from, { react: { text: "🎵", key: m.key } });

    // 1. YouTube Search
    const search = await yts(query);
    const video = search.videos[0];
    if (!video) return m.reply("❌ No results found.");

    // 2. Metadata / Context Info
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
        body: `sᴇᴀʀᴄʜɪɴɢ: ${video.title}`,
        thumbnailUrl: video.thumbnail,
        sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
        mediaType: 1,
        renderLargerThumbnail: false
      }
    };

    // 3. Send Initial Info
    const infoCaption = `*🎶 ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴘʟᴀʏᴇʀ*\n\n` +
                        `╭───────────────◆\n` +
                        `│ 📑 *ᴛɪᴛʟᴇ:* ${video.title}\n` +
                        `│ ⏳ *ᴅᴜʀᴀᴛɪᴏɴ:* ${video.timestamp}\n` +
                        `│ 👤 *ᴀᴜᴛʜᴏʀ:* ${video.author.name}\n` +
                        `╰────────────────◆\n\n` +
                        `_📥 ᴘʀᴇᴘᴀʀɪɴɢ ʏᴏᴜʀ ᴀᴜᴅɪᴏ ꜰɪʟᴇ..._`;

    await Matrix.sendMessage(m.from, {
      image: { url: video.thumbnail },
      caption: infoCaption,
      contextInfo
    }, { quoted: m });

    // 4. Get Download Link (Vreden API as requested)
    const apiUrl = `https://api.vreden.my.id/api/v1/download/ytmp3?url=${video.url}`;
    const apiResponse = await axios.get(apiUrl);

    if (!apiResponse.data?.status) {
      throw new Error("API failed to process video.");
    }

    const downloadUrl = apiResponse.data.result?.url || apiResponse.data.url;

    // 5. Send as Document (Matches the standalone script style)
    // This allows the file to show up with the actual name and .mp3 extension
    await Matrix.sendMessage(m.from, {
      document: { url: downloadUrl },
      fileName: `${video.title}.mp3`,
      mimetype: "audio/mpeg",
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: "ᴘᴏᴘᴋɪᴅ xᴍᴅ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ",
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: true // Set to true for a nice big thumbnail
        }
      }
    }, { quoted: m });

    await Matrix.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("PLAY ERROR:", error);
    m.reply(`❌ *ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ:* ${error.message}`);
    await Matrix.sendMessage(m.from, { react: { text: "❌", key: m.key } });
  }
};

export default playCmd;
