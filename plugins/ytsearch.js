import axios from 'axios';
import config from '../config.cjs';

const youtubeSearch = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "yts" && cmd !== "ytsearch") return;

  try {
    const query = body.slice(prefix.length + cmd.length).trim();

    if (!query) {
      return m.reply("🔍 *Usage:* .yts [search query]");
    }

    await m.reply("_🔎 Searching YouTube..._");

    // Fetch data from the Search API
    const apiUrl = `https://api.yupra.my.id/api/search/youtube?q=${encodeURIComponent(query)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate response
    if (!res || res.status !== true || !res.results || res.results.length === 0) {
      return m.reply("❌ *No results found.*");
    }

    let searchText = `🌟 *YOUTUBE SEARCH RESULTS* 🌟\n\n`;

    // Limit to top 5 results for clarity
    const topResults = res.results.slice(0, 5);

    topResults.forEach((video, index) => {
      searchText += `*${index + 1}.* ${video.title}\n`;
      searchText += `⏱️ *Duration:* ${video.duration}\n`;
      searchText += `👁️ *Views:* ${video.views}\n`;
      searchText += `🔗 *URL:* ${video.url}\n\n`;
    });

    searchText += `_💡 Use .play3 [url] to download audio_`;

    // Send search list with the first result's thumbnail
    await gss.sendMessage(m.from, {
      image: { url: topResults[0].thumbnail },
      caption: searchText
    }, { quoted: m });

  } catch (error) {
    console.error("YTS CMD ERROR:", error);
    m.reply("⚠️ *System Error:* Search service is temporarily unavailable.");
  }
};

export default youtubeSearch;
