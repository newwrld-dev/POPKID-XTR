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
      return m.reply("✨ *Usage:* .play3 [song name]");
    }

    // Search YouTube
    const search = await yts(text);
    if (!search.videos || search.videos.length === 0) {
      return m.reply("🚫 *No results found.*");
    }

    const video = search.videos[0];
    const urlYt = video.url;

    // Stylish "Found It" message with metadata
    const infoMsg = `🎧 *TITLE:* ${video.title}\n` +
                    `⏱️ *DURATION:* ${video.timestamp}\n` +
                    `🔗 *URL:* ${urlYt}\n\n` +
                    `_⚡ Fetching high-quality audio..._`;

    await gss.sendMessage(m.from, { 
      image: { url: video.thumbnail }, 
      caption: infoMsg 
    }, { quoted: m });

    // Fetch MP3 from the new API
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(urlYt)}`;
    const response = await axios.get(apiUrl);
    const result = response.data;

    // Validate the new API response
    if (!result || !result.success || !result.data?.download_url) {
      return m.reply("❌ *Error:* The download provider returned an invalid response.");
    }

    const audioUrl = result.data.download_url; //
    const fileName = `${result.data.title || 'audio'}.mp3`; //

    // Send the actual Audio file
    await gss.sendMessage(m.from, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: fileName,
      ptt: false // Set to true if you want it to appear as a voice note
    }, { quoted: m });

  } catch (error) {
    console.error("PLAY3 ERROR:", error);
    m.reply("⚠️ *System Error:*\n" + (error.response?.data?.message || error.message));
  }
};

export default play;
