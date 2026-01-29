import axios from "axios";
import { ttdl } from "ruhend-scraper";
import config from "../config.cjs";

const processed = new Set();

const tiktok = async (m, gss) => {
    const prefix = config.PREFIX;
    const body = m.body || "";
    const chatId = m.from;

    const cmd = body.startsWith(prefix)
        ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
        : "";

    if (!["tiktok", "tt"].includes(cmd)) return;

    try {
        if (processed.has(m.key.id)) return;
        processed.add(m.key.id);
        setTimeout(() => processed.delete(m.key.id), 300000);

        // Extract URL from command
        const args = body.trim().split(/\s+/);
        const url = args.slice(1).join(' ').trim();

        if (!url) {
            return m.reply("Please provide a TikTok link for the video.");
        }

        // Comprehensive URL Validation
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        if (!isValidUrl) {
            return m.reply("That is not a valid TikTok link. Please provide a valid TikTok video link.");
        }

        await gss.sendMessage(chatId, {
            react: { text: '🔄', key: m.key }
        });

        let videoUrl = null;
        let title = "TikTok Video";

        /* ================= SIPUTZX API ================= */
        try {
            const apiUrl = `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { 
                timeout: 15000,
                headers: {
                    'accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.data?.status && response.data.data) {
                const d = response.data.data;
                title = d.metadata?.title || d.title || title;

                if (Array.isArray(d.urls) && d.urls.length > 0) {
                    videoUrl = d.urls[0];
                } else {
                    videoUrl = d.video_url || d.nowm || d.url || d.download_url;
                }
            }
        } catch (apiError) {
            console.error(`Siputzx API failed: ${apiError.message}`);
        }

        /* ================= FALLBACK: RUHEND ================= */
        if (!videoUrl) {
            try {
                const downloadData = await ttdl(url);
                if (downloadData?.data?.length > 0) {
                    const media = downloadData.data.find(v => v.type === 'video' || v.type === 'nowatermark');
                    if (media) videoUrl = media.url;
                }
            } catch (ttdlError) {
                console.error("ttdl fallback failed:", ttdlError.message);
            }
        }

        /* ================= SENDING PHASE ================= */
        if (videoUrl) {
            try {
                const videoResponse = await axios.get(videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://www.tiktok.com/'
                    }
                });
                
                const videoBuffer = Buffer.from(videoResponse.data);
                
                // Buffer Validation (File Signatures)
                const isValidVideo = videoBuffer.length > 1000 && (
                    videoBuffer.toString('hex', 0, 4) === '000001ba' || 
                    videoBuffer.toString('hex', 0, 4) === '000001b3' || 
                    videoBuffer.toString('hex', 0, 8) === '0000001866747970' || 
                    videoBuffer.toString('hex', 0, 4) === '1a45dfa3'
                );

                if (!isValidVideo && videoBuffer.length < 10000) {
                    throw new Error("Invalid video buffer detected");
                }

                return await gss.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: "video/mp4",
                    caption: `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Title: ${title}`
                }, { quoted: m });

            } catch (downloadError) {
                console.error(`Buffer send failed, trying direct URL: ${downloadError.message}`);
                // Fallback to sending URL directly (avoids buffer issues)
                return await gss.sendMessage(chatId, {
                    video: { url: videoUrl },
                    mimetype: "video/mp4",
                    caption: `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Title: ${title}`
                }, { quoted: m });
            }
        }

        return m.reply("❌ Failed to download TikTok video. All methods failed.");

    } catch (err) {
        console.error("TIKTOK ERROR:", err);
        m.reply("❌ An error occurred while processing the request.");
    }
};

export default tiktok;
