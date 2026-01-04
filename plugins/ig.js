const { cmd } = require("../command");
const { igdl } = require("ruhend-scraper");

// Store processed message IDs to prevent double-triggering
const processedMessages = new Set();

cmd(
  {
    pattern: "ig",
    alias: ["insta", "instagram", "reels"],
    desc: "Download Instagram Media (Reels, Videos, Photos)",
    category: "download",
    react: "📸",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, isCreator }) => {
    try {
      // 1. Check if message was already processed
      if (processedMessages.has(m.key.id)) return;
      processedMessages.add(m.key.id);
      setTimeout(() => processedMessages.delete(m.key.id), 5 * 60 * 1000);

      // 2. Validate input
      if (!q) return reply("👉 *Please provide an Instagram link.*");

      const instagramPatterns = [
        /https?:\/\/(?:www\.)?instagram\.com\//,
        /https?:\/\/(?:www\.)?instagr\.am\//
      ];

      const isValidUrl = instagramPatterns.some(pattern => pattern.test(q));
      if (!isValidUrl) return reply("❌ *Invalid Link.* Please provide a valid Instagram post or reel link.");

      // 3. Start processing
      await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

      const downloadData = await igdl(q);
      
      if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
        return reply("❌ *No media found.* The post might be private or the link is broken.");
      }

      // 4. Extract and Filter Unique Media
      const mediaData = downloadData.data;
      const seenUrls = new Set();
      const uniqueMedia = mediaData.filter(media => {
        if (!media.url || seenUrls.has(media.url)) return false;
        seenUrls.add(media.url);
        return true;
      }).slice(0, 10); // Limit to 10 items to prevent spamming/crashing

      // 5. Download and Send
      for (let i = 0; i < uniqueMedia.length; i++) {
        try {
          const media = uniqueMedia[i];
          const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(media.url) || media.type === 'video';

          if (isVideo) {
            await conn.sendMessage(from, {
              video: { url: media.url },
              caption: `✨ *IG Downloader by Popkid AI*\n\n✅ *Video [${i + 1}/${uniqueMedia.length}]*`,
              mimetype: "video/mp4"
            }, { quoted: m });
          } else {
            await conn.sendMessage(from, {
              image: { url: media.url },
              caption: `✨ *IG Downloader by Popkid AI*\n\n✅ *Image [${i + 1}/${uniqueMedia.length}]*`
            }, { quoted: m });
          }

          // Small delay between sending multiple items
          if (uniqueMedia.length > 1) await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (mediaError) {
          console.error("Media Send Error:", mediaError);
        }
      }

      // 6. Final success reaction
      await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
      console.error("Popkid AI System Error:", e);
      reply("⚠️ *Error:* Something went wrong while processing your request.");
    }
  }
);
