import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";

const play3 = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmdName = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmdName !== "play3") return;

  const text = body.slice(prefix.length + cmdName.length).trim();
  if (!text) return m.reply("✨ *Usage:* .play3 [song name]");

  try {
    // 1. YouTube Search for Meta
    const search = await yts(text);
    const video = search.videos[0];
    if (!video) return m.reply("🚫 *No results found.*");

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");

    // 2. Stylish Caption
    const infoMsg = `🎶 *POPKID MD SPOTIFY PLAYER*\n\n` +
                    `╭───╼━━━━━━━━━━━━╾───╮\n` +
                    `  📑 Title: ${video.title}\n` +
                    `  ⏳ Duration: ${video.timestamp}\n` +
                    `╰───╼━━━━━━━━━━━━╾───╯\n\n` +
                    `🎧 *Fetching Spotify stream...*`;

    await gss.sendMessage(m.from, { 
      image: { url: video.thumbnail }, 
      caption: infoMsg,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_JID,
          newsletterName: NEWSLETTER_NAME,
          serverMessageId: -1
        },
        externalAdReply: {
            title: NEWSLETTER_NAME,
            body: "Powered by Popkid-MD",
            mediaType: 1,
            sourceUrl: "https://whatsapp.com/channel/0029VaeS6id0VycC9uY09s0F",
            renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // 3. Search and Download from Spotify
    // Using the search endpoint first to avoid the 400 error
    const searchUrl = `https://api.yupra.my.id/api/downloader/spotify?query=${encodeURIComponent(text)}`;
    const response = await axios.get(searchUrl);
    const result = response.data;

    if (!result || !result.status || !result.result?.download?.url) {
       // Fallback: If Spotify fails, we can't send audio
       return m.reply("❌ *Spotify Error:* Could not find a downloadable version of this track.");
    }

    const audioUrl = result.result.download.url;

    // 4. Send the Audio File
    await gss.sendMessage(m.from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: result.result.title || video.title,
          body: `Artist: ${result.result.artist || 'Unknown'}`,
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    await gss.sendMessage(m.from, { react: { text: "🎧", key: m.key } });

  } catch (error) {
    console.error("PLAY3 ERROR:", error);
    // Detailed error reporting
    const errorMsg = error.response?.data?.message || error.message;
    m.reply(`⚠️ *Spotify API Error:* ${errorMsg}\n\n_Tip: If search fails, try pasting the direct Spotify link._`);
  }
};

export default play3;
