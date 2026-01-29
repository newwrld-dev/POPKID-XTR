import axios from 'axios';
import config from '../config.cjs';

const spotifyDownload = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command triggers
  if (cmd !== "spotify" && cmd !== "sp") return;

  try {
    const args = body.slice(prefix.length + cmd.length).trim();

    if (!args) {
      return m.reply("🎵 *Usage:* .spotify [spotify-link]");
    }

    await m.reply("_⏳ Searching and downloading from Spotify..._");

    // API Endpoint for Spotify
    const apiUrl = `https://api.yupra.my.id/api/downloader/spotify?url=${encodeURIComponent(args)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate response status and results
    if (!res || res.status !== true || !res.result?.download?.url) {
      return m.reply("❌ *Error:* Could not find that track. Please provide a valid Spotify link.");
    }

    const track = res.result; //
    const downloadUrl = track.download.url; //
    const caption = `🎶 *SPOTIFY DOWNLOAD*\n\n` +
                    `📌 *Title:* ${track.title}\n` +
                    `👤 *Artist:* ${track.artist}\n` +
                    `💿 *Album:* ${track.album || 'Single'}\n\n` +
                    `_⚡ Sending audio file..._`;

    // Send the track thumbnail first for a stylish look
    if (track.image) {
      await gss.sendMessage(m.from, { 
        image: { url: track.image }, 
        caption: caption 
      }, { quoted: m });
    }

    // Send the actual Audio file
    await gss.sendMessage(m.from, {
      audio: { url: downloadUrl },
      mimetype: "audio/mpeg",
      fileName: `${track.title}.mp3`
    }, { quoted: m });

  } catch (error) {
    console.error("SPOTIFY CMD ERROR:", error);
    m.reply("⚠️ *System Error:* The Spotify downloader is currently unavailable.");
  }
};

export default spotifyDownload;
