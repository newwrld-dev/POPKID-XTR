import axios from 'axios';
import yts from 'yt-search';
import config from '../config.cjs';

const play = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command name
  if (cmd !== "play3") return;

  try {
    // Get search query
    const text = body.slice(prefix.length + cmd.length).trim();

    if (!text) {
      return m.reply("🎵 Please provide a song name!\n\nExample:\n.play calm down");
    }

    // Search YouTube
    const search = await yts(text);
    if (!search.videos || search.videos.length === 0) {
      return m.reply("❌ No songs found.");
    }

    const video = search.videos[0];
    const urlYt = video.url;

    // Loading message
    await m.reply("_⏳ Please wait, downloading your song..._");

    // Fetch MP3 from API
    const response = await axios.get(
      `https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`
    );

    const data = response.data;

    if (!data || !data.status || !data.result?.downloadUrl) {
      return m.reply("❌ Failed to fetch audio. Try again later.");
    }

    const audioUrl = data.result.downloadUrl;
    const title = data.result.title || video.title;

    // Send audio IN THE SAME CHAT
    await gss.sendMessage(m.from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${title}.mp3`
    }, { quoted: m });

  } catch (error) {
    console.error("PLAY CMD ERROR:", error);
    m.reply("❌ Error downloading song:\n" + error.message);
  }
};

export default play;
