const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

// POPKID VERIFIED CONTACT
const quotedContact = {
  key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: "status@broadcast" },
  message: {
    contactMessage: {
      displayName: "POP KIDS VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:POP KIDS VERIFIED ✅
ORG:POP KIDS BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

const processed = new Set();

cmd({
  pattern: "movie",
  alias: ["film", "downloadmovie", "mk"],
  react: "🎬",
  desc: "Download movies using GiftedTech Movie API (robust parser)",
  category: "movies",
  use: ".movie <movie name>",
  filename: __filename
},
async (conn, mek, m, { from, q, sender }) => {
  const newsletterConfig = {
    contextInfo: {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363289379419860@newsletter',
        newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃',
        serverMessageId: 222
      }
    }
  };

  try {
    if (processed.has(mek.key.id)) return;
    processed.add(mek.key.id);
    setTimeout(() => processed.delete(mek.key.id), 5 * 60 * 1000);

    const query = q?.trim();
    if (!query) {
      return conn.sendMessage(from, { text: "🎬 Provide a movie name to search\n\nExample: .movie Avatar", ...newsletterConfig }, { quoted: quotedContact });
    }

    await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });
    await conn.sendMessage(from, { text: `🎬 Searching for: *${query}*...`, ...newsletterConfig }, { quoted: quotedContact });

    // --- Try search endpoint
    const searchUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}`;

    let searchRes;
    try {
      searchRes = await axios.get(searchUrl, { timeout: 15000 });
    } catch (err) {
      console.error("Search request failed:", err.message);
      return conn.sendMessage(from, { text: "❌ Search request failed. Try again later.", ...newsletterConfig }, { quoted: quotedContact });
    }

    // --- Normalize results: support multiple response shapes
    // Possibilities:
    // 1) res.data = [ { ... }, ... ]
    // 2) res.data = { results: { items: [ ... ], pager: { ... } } }
    // 3) res.data = { items: [ ... ] } etc.
    const payload = searchRes.data;
    let items = [];

    if (Array.isArray(payload)) {
      items = payload;
    } else if (payload?.results?.items && Array.isArray(payload.results.items)) {
      items = payload.results.items;
    } else if (Array.isArray(payload?.items)) {
      items = payload.items;
    } else if (payload?.data && Array.isArray(payload.data)) {
      items = payload.data;
    } else {
      // Nothing matched — debug log the structure for you
      console.warn("Unknown search response shape:", Object.keys(payload || {}));
      console.debug("Full payload preview:", JSON.stringify(payload).slice(0, 2000));
    }

    // If no items found but API indicates nextPage, try it once
    if ((!items || items.length === 0) && payload?.results?.pager?.hasMore && payload.results.pager.nextPage) {
      try {
        const nextPage = payload.results.pager.nextPage;
        const pageUrl = `https://movieapi.giftedtech.co.ke/api/search/${encodeURIComponent(query)}?page=${nextPage}`;
        const nextRes = await axios.get(pageUrl, { timeout: 15000 });
        const p = nextRes.data;
        if (Array.isArray(p)) items = p;
        else if (p?.results?.items) items = p.results.items;
        else if (Array.isArray(p?.items)) items = p.items;
      } catch (e) {
        console.warn("Next page fetch failed:", e.message);
      }
    }

    if (!items || items.length === 0) {
      return conn.sendMessage(from, { text: `❌ No results found for *${query}* (tried first page)`, ...newsletterConfig }, { quoted: quotedContact });
    }

    const movie = items[0]; // best match
    const movieId = movie.subjectId || movie.id || movie.subjectId || movie.subjectID || movie._id || movie.subjectId; // try common keys
    const title = (movie.title || movie.name || movie.titleText || "Unknown Title").toString();
    const poster = movie.image || movie.poster || movie.cover || movie.thumbnail || "";

    // send preview card
    await conn.sendMessage(from, {
      image: poster ? { url: poster } : undefined,
      caption: `
🎬 *${title}*
🗓️ Year: ${movie.year || movie.releaseYear || "Unknown"}
⭐ Rating: ${movie.rating || movie.imdb || "N/A"}

> Fetching best download quality...
      `.trim(),
      ...newsletterConfig
    }, { quoted: quotedContact });

    // --- Get sources
    const idForSources = movieId || movie.subjectId || movie.subjectID || movie.id;
    if (!idForSources) {
      console.warn("Could not determine movie id for sources, movie object:", movie);
      return conn.sendMessage(from, { text: "⚠️ Could not find movie id to fetch sources.", ...newsletterConfig }, { quoted: quotedContact });
    }

    const srcUrl = `https://movieapi.giftedtech.co.ke/api/sources/${encodeURIComponent(idForSources)}`;
    let srcRes;
    try {
      srcRes = await axios.get(srcUrl, { timeout: 15000 });
    } catch (err) {
      console.error("Sources request failed:", err.message);
      return conn.sendMessage(from, { text: "❌ Failed to fetch download sources.", ...newsletterConfig }, { quoted: quotedContact });
    }

    let sources = Array.isArray(srcRes.data) ? srcRes.data : srcRes.data?.results || srcRes.data?.sources || srcRes.data?.data || [];
    // ensure array
    if (!Array.isArray(sources) && sources?.items) sources = sources.items;
    if (!Array.isArray(sources)) sources = [];

    if (sources.length === 0) {
      console.warn("No sources returned:", JSON.stringify(srcRes.data).slice(0, 800));
      return conn.sendMessage(from, { text: "⚠️ No download sources available for this movie.", ...newsletterConfig }, { quoted: quotedContact });
    }

    // pick highest numeric quality if quality field exists, else first entry
    let best = sources[0];
    try {
      const sortable = sources
        .map(s => ({ s, q: parseInt((s.quality || "").toString().replace(/\D/g, "")) || 0 }))
        .sort((a, b) => b.q - a.q);
      best = sortable[0].s;
    } catch (e) {
      best = sources[0];
    }

    const downloadUrl = best.download_url || best.url || best.link || best.file || best.src;
    if (!downloadUrl) {
      console.warn("No download URL in chosen source:", best);
      return conn.sendMessage(from, { text: "❌ Download URL missing in chosen source.", ...newsletterConfig }, { quoted: quotedContact });
    }

    await conn.sendMessage(from, { text: `📥 Downloading *${title}* • Quality: *${best.quality || "unknown"}* — please wait...`, ...newsletterConfig }, { quoted: quotedContact });

    // --- Download buffer
    let videoResp;
    try {
      videoResp = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxContentLength: 1024 * 1024 * 1024 // 1GB cap
      });
    } catch (err) {
      console.error("Download request failed:", err.message);
      // fallback: attempt to send the direct url instead of buffer
      try {
        return await conn.sendMessage(from, {
          video: { url: downloadUrl },
          mimetype: "video/mp4",
          caption: `🎬 *${title}* • Quality: ${best.quality || "unknown"} (Sent via URL)`,
          ...newsletterConfig
        }, { quoted: quotedContact });
      } catch (e) {
        return conn.sendMessage(from, { text: "❌ Failed to download or stream the movie file.", ...newsletterConfig }, { quoted: quotedContact });
      }
    }

    const buffer = Buffer.from(videoResp.data || []);
    if (!buffer || buffer.length < 5000) {
      console.warn("Downloaded buffer too small; length:", buffer?.length);
      return conn.sendMessage(from, { text: "❌ Invalid or too-small movie file received.", ...newsletterConfig }, { quoted: quotedContact });
    }

    // send as document to avoid compression
    await conn.sendMessage(from, {
      document: buffer,
      mimetype: "video/mp4",
      fileName: `${title}.mp4`,
      caption: `🎬 *${title}*\n📥 Download Complete\nQuality: ${best.quality || "unknown"}`,
      ...newsletterConfig
    }, { quoted: quotedContact });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error("Movie command error:", err);
    await conn.sendMessage(from, { text: "❌ Something went wrong while fetching movie. Check logs.", ...newsletterConfig }, { quoted: quotedContact });
  }
});
