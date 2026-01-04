const { cmd } = require("../command");
const { igdl } = require("ruhend-scraper");

const processedMessages = new Set();

cmd(
  {
    pattern: "ig",
    alias: ["insta", "instagram", "reels"],
    desc: "Download Instagram Media",
    category: "download",
    react: "📸",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (processedMessages.has(m.key.id)) return;
      processedMessages.add(m.key.id);
      setTimeout(() => processedMessages.delete(m.key.id), 5 * 60 * 1000);

      if (!q) return reply("👉 *Please provide an Instagram link.*");

      await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

      const downloadData = await igdl(q);
      
      if (!downloadData || !downloadData.data || downloadData.data.length === 0) {
        return reply("❌ *No media found.* Make sure the link is public.");
      }

      const uniqueMedia = [];
      const seenUrls = new Set();
      for (const media of downloadData.data) {
        if (media.url && !seenUrls.has(media.url)) {
          seenUrls.add(media.url);
          uniqueMedia.push(media);
        }
      }

      for (let i = 0; i < uniqueMedia.length; i++) {
        const media = uniqueMedia[i];
        
        // --- IMPROVED VIDEO DETECTION ---
        // Check extension, OR scraper type, OR if the original link is a /reel/
        const isVideo = 
          /\.(mp4|mov|avi|mkv|webm)/i.test(media.url) || 
          media.type === 'video' || 
          q.includes('/reel/') || 
          q.includes('/tv/');

        if (isVideo) {
          await conn.sendMessage(from, {
            video: { url: media.url },
            caption: `✨ *IG Downloader by Popkid AI*\n\n✅ *Video [${i + 1}/${uniqueMedia.length}]*`,
            mimetype: "video/mp4",
            fileName: `popkid_ai.mp4` // Forces WhatsApp to treat it as a video file
          }, { quoted: m });
        } else {
          await conn.sendMessage(from, {
            image: { url: media.url },
            caption: `✨ *IG Downloader by Popkid AI*\n\n✅ *Image [${i + 1}/${uniqueMedia.length}]*`
          }, { quoted: m });
        }

        if (uniqueMedia.length > 1) await new Promise(r => setTimeout(r, 1500));
      }

      await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (e) {
      console.error(e);
      reply("⚠️ *Error:* " + e.message);
    }
  }
);
