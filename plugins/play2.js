import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const NEWSLETTER_JID = "120363423997837331@newsletter";
const NEWSLETTER_NAME = "POPKID MD";

const play2 = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmdName = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmdName !== "play2") return;

  const text = body.slice(prefix.length + cmdName.length).trim();
  if (!text) return m.reply("✨ *Usage:* .play2 [song name]");

  try {
    // 1. YouTube Search
    const search = await yts(text);
    const video = search.videos[0];
    if (!video) return m.reply("🚫 *No results found.*");

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");

    // 2. Info Caption
    const infoMsg = `🎶 *POPKID MD PLAYER v2*\n\n` +
                    `╭───╼━━━━━━━━━━━━╾───╮\n` +
                    `  📄 Title: ${video.title}\n` +
                    `  ⏳ Duration: ${video.timestamp}\n` +
                    `╰───╼━━━━━━━━━━━━╾───╯\n\n` +
                    `⏳ *Downloading audio buffer...*`;

    // 3. Send Preview
    await gss.sendMessage(m.from, { 
      image: { url: video.thumbnail }, 
      caption: infoMsg
    }, { quoted: m });

    // 4. Fetch the Download Link
    const apiUrl = `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(video.url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.success || !data.result?.download_url) {
      return m.reply("❌ *Error:* API failed to generate a download link.");
    }

    const audioUrl = data.result.download_url;

    // 5. DOWNLOAD THE FILE TO BUFFER (The Fix)
    // This ensures the audio is playable because you're sending the actual data
    const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data, 'utf-8');

    // 6. Send the Audio Buffer
    await gss.sendMessage(m.from, {
      audio: audioBuffer, // Sending buffer instead of { url: audioUrl }
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: `POPKID MD - ${video.author.name}`,
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: false,
          sourceUrl: video.url
        }
      }
    }, { quoted: m });

    // Success Reaction
    await gss.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("PLAY2 ERROR:", error);
    m.reply("⚠️ *Error:* " + error.message);
  }
};

export default play2;
