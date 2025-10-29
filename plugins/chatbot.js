const axios = require('axios');
const { cmd, commands } = require('../command');
const config = require('../config');
const { loadState, saveState } = require('../lib/chatbotdb');

let AI_STATE = loadState(); // Load stored state on startup

// 🔹 Enable/Disable Command
cmd({
    pattern: "chatbot",
    alias: ["ai", "dj", "botai"],
    desc: "Enable or disable AI chatbot.",
    category: "settings",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("📛 *Only the owner can use this command!*");

    const mode = args[0]?.toLowerCase();
    const target = args[1]?.toLowerCase();

    if (!mode) {
        return reply(`╭───❖ *AI Chatbot Menu* ❖───╮
│ 💠 .chatbot on all - Enable AI everywhere
│ 💠 .chatbot on ib  - Enable AI in inbox
│ 💠 .chatbot on gc  - Enable AI in groups
│ ❌ .chatbot off all - Disable AI everywhere
│ ❌ .chatbot off ib  - Disable AI in inbox
│ ❌ .chatbot off gc  - Disable AI in groups
│ 🔎 .chatbot status  - Check AI mode
╰──────────────────────╯`);
    }

    if (mode === "on") {
        if (!target || target === "all") {
            AI_STATE = { IB: "true", GC: "true" };
            saveState(AI_STATE);
            return reply("🤖 AI chatbot *enabled* for inbox and groups.");
        } else if (target === "ib") {
            AI_STATE.IB = "true";
            saveState(AI_STATE);
            return reply("💬 AI chatbot *enabled* for inbox only.");
        } else if (target === "gc") {
            AI_STATE.GC = "true";
            saveState(AI_STATE);
            return reply("👥 AI chatbot *enabled* for groups only.");
        }
    } else if (mode === "off") {
        if (!target || target === "all") {
            AI_STATE = { IB: "false", GC: "false" };
            saveState(AI_STATE);
            return reply("🤖 AI chatbot *disabled* everywhere.");
        } else if (target === "ib") {
            AI_STATE.IB = "false";
            saveState(AI_STATE);
            return reply("💬 AI chatbot *disabled* for inbox.");
        } else if (target === "gc") {
            AI_STATE.GC = "false";
            saveState(AI_STATE);
            return reply("👥 AI chatbot *disabled* for groups.");
        }
    } else if (mode === "status") {
        return reply(`🧠 *AI Chatbot Status:*
> Inbox: ${AI_STATE.IB === "true" ? "✅ ON" : "❌ OFF"}
> Groups: ${AI_STATE.GC === "true" ? "✅ ON" : "❌ OFF"}`);
    } else {
        return reply("❗Invalid command format.\nTry `.chatbot on all` or `.chatbot off ib`");
    }
});

// 🔹 Auto AI Reply System
cmd({
    on: "body"
}, async (conn, m, store, { from, body, isGroup, reply }) => {
    try {
        // Prevent command/empty messages
        if (!body || body.startsWith(config.PREFIX)) return;

        const isInbox = !isGroup;
        if ((isInbox && AI_STATE.IB !== "true") || (isGroup && AI_STATE.GC !== "true")) return;

        // Optional: ignore if message isn’t replying to the bot
        if (m.key.fromMe) return;

        const prompt = encodeURIComponent("You are popkid, a confident and smart WhatsApp AI bot created by popkid from Kenya. Reply naturally, respectfully, and include this footer:\n> powered by popkid xtr ⚡");
        const query = encodeURIComponent(body);

        const apiUrl = `https://bk9.fun/ai/BK93?BK9=${prompt}&q=${query}`;
        const { data } = await axios.get(apiUrl);

        if (data?.BK9) {
            await conn.sendMessage(from, { text: data.BK9 }, { quoted: m });
        } else {
            reply("⚠️ AI did not respond. Try again.");
        }
    } catch (err) {
        console.error("Chatbot Error:", err.message);
        reply("❌ Error communicating with AI.");
    }
});
