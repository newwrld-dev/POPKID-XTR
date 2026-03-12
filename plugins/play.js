import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

// Bot Constants for styling
const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";
const BASE_URL = "https://noobs-api.top";

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmdName = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmdName !== "play" && cmdName !== "p") return;

  const text = body.slice(prefix.length + cmdName.length).trim();
  if (!text) return m.reply("✨ *Usage:* .play [song name]");

  try {
    // 1. Search YouTube
    const search = await yts(text);
    const video = search.videos[0];
    if (!video) return m.reply("🚫 *No results found.*");

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    
    // 2. Build the Stylish Caption
    const infoMsg = `🎶 *POPKID MD PLAYER*\n\n` +
                    `╭───────────────◆\n` +
                    `│ 📑 Title: ${video.title}\n` +
                    `│ ⏳ Duration: ${video.timestamp}\n` +
                    `╰────────────────◆\n\n` +
                    `⏳ *Sending audio...*`;

    // 3. Send Thumbnail with Newsletter Context
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
            body: "Get more info about this message.",
            mediaType: 1,
            sourceUrl: "https://whatsapp.com/channel/0029VaeS6id0VycC9uY09s0F",
            renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // 4. Fetch MP3 using the working Noobs API
    const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.url)}&format=mp3`;
    const { data } = await axios.get(apiURL);

    if (!data || !data.downloadLink) {
      return m.reply("❌ *Error:* Failed to get download link from the provider.");
    }

    // 5. Send Playable Audio with Ad Reply
    await gss.sendMessage(m.from, {
      audio: { url: data.downloadLink },
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: "Popkid-MD Music",
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // Success Reaction
    await gss.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("PLAY ERROR:", error);
    m.reply("⚠️ *System Error:* " + (error.response?.data?.message || error.message));
  }
};

export default play;
