import axios from 'axios';
import config from '../config.cjs';

const spotifySearch = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command triggers
  if (cmd !== "sps" && cmd !== "spotifysearch") return;

  try {
    const query = body.slice(prefix.length + cmd.length).trim();

    if (!query) {
      return m.reply("🔍 *Usage:* .sps [song name]");
    }

    await m.reply("_🔎 Searching Spotify for tracks..._");

    // API Endpoint for Spotify Search
    const apiUrl = `https://api.yupra.my.id/api/search/spotify?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate response status and results
    if (!res || res.status !== true || !res.result || res.result.length === 0) {
      return m.reply("❌ *No Spotify tracks found.*");
    }

    let searchText = `🎧 *SPOTIFY SEARCH RESULTS* 🎧\n\n`;

    // Limit to top 5 results for clarity
    const tracks = res.result.slice(0, 5);

    tracks.forEach((track, index) => {
      searchText += `*${index + 1}.* ${track.title}\n`;
      searchText += `👤 *Artist:* ${track.artist}\n`;
      searchText += `💿 *Album:* ${track.album || 'N/A'}\n`;
      searchText += `🔗 *URL:* ${track.url}\n\n`;
    });

    searchText += `_💡 Use .spotify [url] to download the audio_`;

    // Send the list with the cover art of the first result
    await gss.sendMessage(m.from, {
      image: { url: tracks[0].cover },
      caption: searchText
    }, { quoted: m });

  } catch (error) {
    console.error("SPOTIFY SEARCH ERROR:", error);
    m.reply("⚠️ *System Error:* Spotify search service is temporarily down.");
  }
};

export default spotifySearch;
