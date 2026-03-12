import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

// Exact Newsletter and Bot Info from your working script
const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";
const BOT = "POPKID-MD";
const BASE_URL = "https://noobs-api.top";

// Exact buildCaption function from your script
const buildCaption = (type, video) => {
  const banner = type === "video" ? `🎬 POPKID MD VIDEO PLAYER` : `🎶 POPKID MD PLAYER`;
  const duration = video.timestamp || video.duration || "N/A";

  return (
    `*${banner}*\n\n` +
    `╭───────────────◆\n` +
    `│ 📑 Title: ${video.title}\n` +
    `│ ⏳ Duration: ${duration}\n` +
    `╰────────────────◆\n\n` +
    `⏳ *Sending audio...*`
  );
};

// Exact getContextInfo function from your script
const getContextInfo = (query = "") => ({
  forwardingScore: 999,
  isForwarded: true,
  forwardedNewsletterMessageInfo: {
    newsletterJid: NEWSLETTER_JID,
    newsletterName: NEWSLETTER_NAME,
    serverMessageId: -1
  },
  body: query ? `Requested: ${query}` : undefined,
  title: BOT
});

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmdName = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Support both "play" and "p" as per your pattern/alias
  if (cmdName !== "play" && cmdName !== "p") return;

  const query = body.slice(prefix.length + cmdName.length).trim();
  if (!query) return m.reply("Please provide a song name.");

  try {
    // 1. YouTube Search (using your logic)
    const search = await yts(query);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);
    if (!video) return m.reply("No results found.");

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeTitle}.mp3`;
    
    // 2. Fetch using working API (using your exact logic)
    const apiURL = `${BASE_URL}/dipto/ytDl3?link=${encodeURIComponent(video.videoId || video.url)}&format=mp3`;
    const { data } = await axios.get(apiURL);
    
    if (!data || !data.downloadLink) return m.reply("Failed to get download link.");

    // 3. Send exact Image Preview with "View Channel" link
    await gss.sendMessage(m.from, {
      image: { url: video.thumbnail },
      caption: buildCaption("audio", video),
      contextInfo: {
        ...getContextInfo(query),
        externalAdReply: {
            title: NEWSLETTER_NAME,
            body: "Get more info about this message.",
            mediaType: 1,
            sourceUrl: "https://whatsapp.com/channel/0029VaeS6id0VycC9uY09s0F", 
            renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // 4. Send Playable Audio
    await gss.sendMessage(m.from, {
      audio: { url: data.downloadLink },
      mimetype: "audio/mpeg",
      fileName: fileName,
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

  } catch (e) {
    console.error("[PLAY ERROR]", e);
    m.reply("An error occurred while processing your request.");
  }
};

export default play;
