const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

const chatMemory = {
    messages: new Map(),
    userInfo: new Map()
};

// Load user group data
function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch {
        return { chatbot: {} };
    }
}

// Save user group data
function saveUserGroupData(data) {
    fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
}

// Typing delay
function randomDelay() {
    return Math.floor(Math.random() * 2000) + 1500;
}

// Show typing
async function showTyping(conn, id) {
    try {
        await conn.presenceSubscribe(id);
        await conn.sendPresenceUpdate('composing', id);
        await new Promise(r => setTimeout(r, randomDelay()));
    } catch {}
}

// Extract basic user info
function extractUserInfo(text) {
    const info = {};
    const t = text.toLowerCase();

    if (t.includes("my name is"))
        info.name = text.split("my name is")[1].trim().split(" ")[0];

    if (t.includes("i am") && t.includes("years old"))
        info.age = text.match(/\d+/)?.[0];

    if (t.includes("i live in") || t.includes("i am from"))
        info.location = text.split(/i live in|i am from/i)[1].trim().split(/[.,!?]/)[0];

    return info;
}

// Call Gifted AI
async function giftedAI(prompt) {
    try {
        const url = `https://api.giftedtech.co.ke/api/ai/gpt?apikey=gifted&q=${encodeURIComponent(prompt)}`;
        const res = await fetch(url);
        const json = await res.json();

        return json.result || json.reply || "I couldn't process that 😅";
    } catch (e) {
        return "AI API error 😅";
    }
}

/*  
────────────────────────────────────────
 CHATBOT COMMAND: .chatbot on/off
────────────────────────────────────────
*/
cmd({
    pattern: "chatbot",
    alias: [],
    desc: "Enable or disable chatbot in group",
    category: "group",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    const chatId = from;
    const match = args[0];
    const data = loadUserGroupData();

    const botId = conn.user.id.split(":")[0] + "@s.whatsapp.net";
    const sender = mek.key.participant || mek.participant || mek.key.remoteJid;

    const isOwner = sender === botId;

    // Check admin if group
    let isAdmin = false;
    if (chatId.endsWith("@g.us")) {
        try {
            const meta = await conn.groupMetadata(chatId);
            const me = meta.participants.find(v => v.id === sender);
            isAdmin = me?.admin === "admin" || me?.admin === "superadmin";
        } catch {}
    }

    if (!match) {
        return reply("*Usage:*\n.chatbot on\n.chatbot off");
    }

    if (!isOwner && !isAdmin) return reply("❌ Only admins or owner can use chatbot settings.");

    if (match === "on") {
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        return reply("🤖 Chatbot has been *enabled* in this group.");
    }

    if (match === "off") {
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        return reply("🛑 Chatbot has been *disabled* in this group.");
    }

    reply("❌ Invalid option. Use `.chatbot on` or `.chatbot off`");
});

/*  
────────────────────────────────────────
 AUTO REPLY HANDLER
────────────────────────────────────────
*/
async function chatbotAutoReply(conn, mek) {
    try {
        const chatId = mek.key.remoteJid;
        const data = loadUserGroupData();

        if (!data.chatbot[chatId]) return; // Chatbot disabled

        const sender = mek.key.participant || mek.participant || mek.key.remoteJid;

        let text =
            mek.message?.conversation ||
            mek.message?.extendedTextMessage?.text ||
            "";

        if (!text) return;

        const botId = conn.user.id.split(":")[0] + "@s.whatsapp.net";
        const botTag = `@${botId.split("@")[0]}`;

        const isMention = text.includes(botTag);

        if (!isMention) return;

        text = text.replace(botTag, "").trim();

        // Initialize user memory
        if (!chatMemory.messages.has(sender)) {
            chatMemory.messages.set(sender, []);
            chatMemory.userInfo.set(sender, {});
        }

        // Extract info
        const info = extractUserInfo(text);
        if (Object.keys(info).length > 0) {
            chatMemory.userInfo.set(sender, { 
                ...chatMemory.userInfo.get(sender),
                ...info
            });
        }

        // Store conversation
        const logs = chatMemory.messages.get(sender);
        logs.push(text);
        if (logs.length > 20) logs.shift();

        await showTyping(conn, chatId);

        // Build prompt
        const prompt = `
User Info: ${JSON.stringify(chatMemory.userInfo.get(sender))}
Chat History: ${logs.join("\n")}
User: ${text}
`;

        const response = await giftedAI(prompt);

        await new Promise(r => setTimeout(r, randomDelay()));

        await conn.sendMessage(chatId, { text: response }, { quoted: mek });

    } catch (err) {
        console.log("Chatbot error:", err);
    }
}

module.exports = chatbotAutoReply;
