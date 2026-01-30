import axios from 'axios';
import config from '../config.cjs';

const episodeDownloader = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "episode" && cmd !== "tv" && cmd !== "movie") return;

  try {
    const url = body.slice(prefix.length + cmd.length).trim();

    if (!url) {
      return m.reply("🎬 *Usage:* .episode https://cineru.lk/tv_series/from-2022-s01-sinhala-subtitles/");
    }

    // Professional feedback
    await gss.sendPresenceUpdate('composing', m.from);
    await m.reply("_⏳ Fetching movie data... This may take a moment for large files._");

    // Fetch from Arslan API
    const apiUrl = `https://arslan-apis.vercel.app/movie/sinhalasub/episode?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate API response
    if (!res || res.status !== true || !res.result) {
      return m.reply("❌ *Error:* Failed to fetch the movie. Please check the URL.");
    }

    const item = res.result; //
    const title = item.title || "Movie_File"; //
    const dlUrl = item.download_url || item.url; //

    // Send as Document to preserve original quality
    await gss.sendMessage(m.from, {
      document: { url: dlUrl },
      mimetype: 'video/mp4',
      fileName: `${title}.mp4`,
      caption: `🎬 *FILE DOWNLOADED*\n\n📌 *Name:* ${title}\n🚀 *Quality:* Original (No Compression)`
    }, { quoted: m });

  } catch (error) {
    console.error("MOVIE DL ERROR:", error);
    m.reply("⚠️ *System Error:* Unable to process the movie request at this time.");
  }
};

export default episodeDownloader;
