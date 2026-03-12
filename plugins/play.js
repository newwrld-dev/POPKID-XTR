import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "play") return;

  try {
    const text = body.slice(prefix.length + cmd.length).trim();

    if (!text) {
      return m.reply("✨ *Usage:* .play [song name]");
    }

    // 1. YouTube Search
    const search = await yts(text);
    const video = (search && (search.videos && search.videos[0])) || (search.all && search.all[0]);
    if (!video) return m.reply("🚫 *No results found.*");

    const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeTitle}.mp3`;

    // 2. Fetch using new API
    // Note: Ensure BASE_URL is defined or replace it with the direct URL
    const apiURL = `https://api.diptosapi.workers.dev/dipto/ytDl3?link=${encodeURIComponent(video.url)}&format=mp3`;
    const { data } = await axios.get(apiURL);
    
    if (!data || !data.downloadLink) return m.reply("❌ *Failed to get download link.*");

    // 3. Send exact Image Preview with "View Channel" link
    const infoMsg = `🎧 *TITLE:* ${video.title}\n` +
                    `⏱️ *DURATION:* ${video.timestamp}\n` +
                    `🔗 *URL:* ${video.url}\n\n` +
                    `_⚡ Fetching high-quality audio..._`;

    await gss.sendMessage(m.from, {
      image: { url: video.thumbnail },
      caption: infoMsg,
      contextInfo: {
        externalAdReply: {
            title: "Popkid-MD",
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

  } catch (error) {
    console.error("PLAY ERROR:", error);
    m.reply("⚠️ *System Error:*\n" + (error.response?.data?.message || error.message));
  }
};

export default play;
