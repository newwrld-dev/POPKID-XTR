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

    // 2. Build the Stylish Caption
    const infoMsg = `🎶 *POPKID MD PLAYER v2*\n\n` +
                    `╭───╼━━━━━━━━━━━━╾───╮\n` +
                    `  📄 Title: ${video.title}\n` +
                    `  ⏳ Duration: ${video.timestamp}\n` +
                    `╰───╼━━━━━━━━━━━━╾───╯\n\n` +
                    `⏳ *Sending audio via GiftedTech...*`;

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
            body: "Powered by GiftedTech",
            mediaType: 1,
            sourceUrl: "https://whatsapp.com/channel/0029VaeS6id0VycC9uY09s0F",
            renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // 4. Fetch MP3 using the registered API Key (apikey=gifted)
    const apiUrl = `https://api.giftedtech.co.ke/api/download/dlmp3?apikey=gifted&url=${encodeURIComponent(video.url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.success || !data.result?.download_url) {
      return m.reply("❌ *Error:* API failed to generate a download link.");
    }

    const audioUrl = data.result.download_url;

    // 5. Send the Audio File
    await gss.sendMessage(m.from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${safeTitle}.mp3`,
      ptt: false,
      contextInfo: {
        externalAdReply: {
          title: video.title,
          body: `Quality: ${data.result.quality || '128kbps'}`,
          mediaType: 1,
          thumbnailUrl: video.thumbnail,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // Success Reaction
    await gss.sendMessage(m.from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("PLAY2 ERROR:", error);
    m.reply("⚠️ *API Error:* " + (error.response?.data?.message || error.message));
  }
};

export default play2;
