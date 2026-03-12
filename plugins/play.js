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
    // 1. Search YouTube for metadata/thumbnail
    const search = await yts(text);
    const video = search.videos[0];
    if (!video) return m.reply("🚫 *No results found.*");

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");

    // 2. Build the Stylish Caption
    const infoMsg = `🎶 *POPKID MD SPOTIFY PLAYER*\n\n` +
                    `╭───╼━━━━━━━━━━━━╾───╮\n` +
                    `  📑 Title: ${video.title}\n` +
                    `  ⏳ Duration: ${video.timestamp}\n` +
                    `╰───╼━━━━━━━━━━━━╾───╯\n\n` +
                    `🎧 *Fetching Spotify stream...*`;

    // 3. Send Preview Image
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
            body: "Powered by YP INC / Spotidown",
            mediaType: 1,
            sourceUrl: "https://whatsapp.com/channel/0029VaeS6id0VycC9uY09s0F",
            renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    /** * 4. Fetch Audio from Spotidown API
     * Note: We use the search query to find the best match on their server
     */
    const apiUrl = `https://api.yupra.my.id/api/downloader/spotify?query=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl);

    // Targeted check based on your provided JSON structure
    if (!data || !data.status || !data.result?.download?.url) {
      return m.reply("❌ *Error:* Spotify downloader failed to find this track.");
    }

    const audioUrl = data.result.download.url;
    const artistName = data.result.artist || "Popkid Artist";

    // 5. Send the Audio File
    await gss.sendMessage(m.from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: data.result.title || video.title,
          body: `Artist: ${artistName}`,
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // Success Reaction
    await gss.sendMessage(m.from, { react: { text: "🎧", key: m.key } });

  } catch (error) {
    console.error("PLAY3 ERROR:", error);
    m.reply("⚠️ *Spotify API Error:* " + (error.response?.data?.message || error.message));
  }
};

export default play3;
