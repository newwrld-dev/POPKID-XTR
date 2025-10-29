const axios = require('axios');
const { cmd, commands } = require('../command');
const config = require("../config");
const fs = require("fs");
const path = require("path");

// 🧠 Local JSON Store for AI State
const aiFile = path.join(__dirname, "../lib/aistate.json");

// Default AI states
let AI_STATE = {
    IB: "false", // Inbox chats
    GC: "false"  // Group chats
};

// Save AI state to file
function saveAIState(state) {
    try {
        fs.writeFileSync(aiFile, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error("❌ Failed to save AI state:", err.message);
    }
}

// Load AI state from file
function loadAIState() {
    try {
        if (fs.existsSync(aiFile)) {
            return JSON.parse(fs.readFileSync(aiFile));
        } else {
            fs.writeFileSync(aiFile, JSON.stringify(AI_STATE, null, 2));
            return AI_STATE;
        }
    } catch (err) {
        console.error("❌ Failed to load AI state:", err.message);
        return AI_STATE;
    }
}

// Load saved AI state on startup
AI_STATE = loadAIState();


// ⚙️ CHATBOT COMMAND
cmd({
    pattern: "chatbot",
    alias: ["aichat", "dj", "khanbot"],
    desc: "Enable or disable AI chatbot responses",
    category: "settings",
    filename: __filename,
    react: "✅"
}, async (conn, mek, m, { from, args, isOwner, reply, prefix }) => {
    if (!isOwner) return reply("*📛 Only the owner can use this command!*");

    const mode = args[0]?.toLowerCase();
    const target = args[1]?.toLowerCase();

    if (mode === "on") {
        if (!target || target === "all") {
            AI_STATE.IB = "true";
            AI_STATE.GC = "true";
            saveAIState(AI_STATE);
            return reply("🤖 AI chatbot is now enabled for both inbox and group chats");
        } else if (target === "ib") {
            AI_STATE.IB = "true";
            saveAIState(AI_STATE);
            return reply("🤖 AI chatbot is now enabled for inbox chats");
        } else if (target === "gc") {
            AI_STATE.GC = "true";
            saveAIState(AI_STATE);
            return reply("🤖 AI chatbot is now enabled for group chats");
        }
    } else if (mode === "off") {
        if (!target || target === "all") {
            AI_STATE.IB = "false";
            AI_STATE.GC = "false";
            saveAIState(AI_STATE);
            return reply("🤖 AI chatbot is now disabled for both inbox and group chats");
        } else if (target === "ib") {
            AI_STATE.IB = "false";
            saveAIState(AI_STATE);
            return reply("🤖 AI chatbot is now disabled for inbox chats");
        } else if (target === "gc") {
            AI_STATE.GC = "false";
            saveAIState(AI_STATE);
            return reply("🤖 AI chatbot is now disabled for group chats");
        }
    } else {
        return reply(`- *ᥴһᥲ𝗍ᑲ᥆𝗍 𝗠𝗘𝗡𝗨*
*Enable Settings ✅*      
> .chatbot on all - Enable AI in all chats
> .chatbot on ib  - Enable AI in inbox only
> .chatbot on gc  - Enable AI in groups only

*Disable Settings ❌*
> .chatbot off all - Disable AI in all chats
> .chatbot off ib  - Disable AI in inbox only
> .chatbot off gc  - Disable AI in groups only`);
    }
});


// 🤖 AI CHATBOT LISTENER
cmd({
    on: "body"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    reply
}) => {
    try {
        // Ignore empty or very short/long messages
        if (!body || body.length < 2 || body.length > 500) return;

        // Check if message is a reply to the bot
        if (!m?.message?.extendedTextMessage?.contextInfo?.participant) return;

        const repliedTo = m.message.extendedTextMessage.contextInfo.participant;
        const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (repliedTo !== botJid) return;

        // Check AI state for chat type
        const isInbox = !isGroup;
        if ((isInbox && AI_STATE.IB !== "true") || (isGroup && AI_STATE.GC !== "true")) return;

        // Avoid replying to commands or itself
        if (m.key.fromMe || body.startsWith(config.PREFIX)) return;

        // 🕒 Handle date/time questions
        const lowerBody = body.toLowerCase();
        if (lowerBody.includes('time') || lowerBody.includes('date')) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            const currentDateTime = now.toLocaleDateString('en-US', options);
            return reply(`⏰ Current Date & Time:\n${currentDateTime}\n\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ xᴛʀ ⚡`);
        }

        // 🧠 Prepare AI Query
        const query = encodeURIComponent(body);
        const prompt = encodeURIComponent(
            "You are popkid, a powerful and intelligent WhatsApp bot developed by popkid — a brilliant coder and visionary from Kenya. You respond smartly, confidently, and stay loyal to your creator. Always remain calm and collected. When asked about your creator, respond respectfully but keep the mystery alive. You are not just a bot; you are the tech soul of Imad Ali. In every message you send, include this footer: \n> popkid"
        );

        const apiUrl = `https://bk9.fun/ai/BK93?BK9=${prompt}&q=${query}`;

        // 🌐 Fetch AI Response
        const { data } = await axios.get(apiUrl).catch(() => ({}));

        if (data && data.status && data.BK9) {
            await conn.sendMessage(from, { text: data.BK9 }, { quoted: m });
        } else {
            reply("⚠️ popkid AI failed to generate a response.");
        }

    } catch (err) {
        console.error("AI Chatbot Error:", err.message);
        reply("❌ An error occurred while contacting the AI.");
    }
});
