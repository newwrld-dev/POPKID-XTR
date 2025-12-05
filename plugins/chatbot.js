/**
 * POPKID CHATBOT PLUGIN (FULL VERSION)
 * GiftedTech AI + Chatbot ON/OFF + Newsletter + Auto Reply
 */

const axios = require("axios");
const { cmd } = require("../command");
const config = require("../config");

// Ensure needed config values exist
if (!config.CHATBOT) config.CHATBOT = false;
if (!config.AI_API) config.AI_API = "https://api.giftedtech.co.ke/api/ai/mistral";
if (!config.AI_KEY) config.AI_KEY = "gifted";

// =============================================================
// === 1. CHATBOT TOGGLE COMMAND (on/off/status)
// =============================================================
cmd({
    pattern: "chatbot",
    alias: ["botmode", "ai", "talk"],
    desc: "Toggle AI chatbot mode ON or OFF",
    category: "owner",
    react: "🤖",
    filename: __filename,
    fromMe: true
},
async (client, message, m, { args, from, sender, isOwner }) => {

    try {
        if (!isOwner) {
            return client.sendMessage(from, {
                text: "🚫 *Owner-only command!*",
                mentions: [sender]
            }, { quoted: message });
        }

        const action = args[0]?.toLowerCase() || "status";
        let caption = "";
        let extra = "";

        switch (action) {
            case "on":
                if (config.CHATBOT) {
                    caption = "🤖 Chatbot is already *ACTIVE*!";
                } else {
                    config.CHATBOT = true;
                    caption = "🟢 Chatbot has been *ACTIVATED*!";
                    extra = "I will now answer all messages automatically.";
                }
                break;

            case "off":
                if (!config.CHATBOT) {
                    caption = "🔕 Chatbot is already *DISABLED*!";
                } else {
                    config.CHATBOT = false;
                    caption = "🔴 Chatbot has been *DEACTIVATED*!";
                    extra = "I will stop replying automatically.";
                }
                break;

            default:
                caption = `📌 Chatbot Status: ${config.CHATBOT ? "🟢 ACTIVE" : "🔴 INACTIVE"}`;
                extra = config.CHATBOT ? "AI replies are ON." : "AI replies are OFF.";
                break;
        }

        // Newsletter styled reply
        await client.sendMessage(from, {
            image: { url: "https://files.catbox.moe/kiy0hl.jpg" },
            caption: `
${caption}
${extra}

_𝐏𝐎𝐏𝐊𝐈𝐃 𝐀𝐈 𝐂𝐇𝐀𝐓𝐁𝐎𝐓 🌟_
            `,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363289379419860@newsletter',
                    newsletterName: '𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝',
                    serverMessageId: 143
                }
            }
        });

    } catch (err) {
        console.error("Chatbot Toggle Error:", err);
        client.sendMessage(from, { text: `⚠️ Error: ${err.message}` });
    }
});

// =============================================================
// === 2. AUTO CHATBOT HANDLER
// =============================================================
cmd({ on: "body" }, async (client, message, chat, { from, sender, body }) => {
    try {
        // 1 — Chatbot must be ON
        if (!config.CHATBOT) return;

        // 2 — Ignore bot's messages
        if (message.key.fromMe) return;

        // 3 — Ignore empty text
        if (!body) return;

        // 4 — API fetch
        const url = `${config.AI_API}?apikey=${config.AI_KEY}&q=${encodeURIComponent(body)}`;

        const res = await axios.get(url);
        const aiReply = res.data?.response || "I'm here 😊";

        // 5 — Reply to sender
        await client.sendMessage(from, {
            text: aiReply,
            mentions: [sender]
        });

    } catch (err) {
        console.error("Chatbot Auto-Reply Error:", err);
    }
});
