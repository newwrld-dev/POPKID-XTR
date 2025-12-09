const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// In-memory memory storage
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

// Random typing delay
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
    const t = (text || "").toLowerCase();

    if (t.includes("my name is"))
        info.name = text.split(/my name is/i)[1]?.trim().split(" ")[0];

    if (t.includes("i am") && t.includes("years old"))
        info.age = text.match(/\d+/)?.[0];

    if (t.includes("i live in") || t.includes("i am from"))
        info.location = text.split(/i live in|i am from/i)[1]?.trim().split(/[.,!?]/)[0];

    return info;
}

// Gifted AI Call
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
 ONLY CONNECTED ACCOUNT (bot session) CAN USE
────────────────────────────────────────
*/
cmd({
    pattern: "chatbot",
    alias: [],
    desc: "Enable or disable chatbot in group/chat",
    category: "group",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, reply, args }) => {
    const chatId = from;
    const data = loadUserGroupData();

    const sender = mek.key.participant || mek.participant || mek.key.remoteJid;

    // BOT OWNER = the account connected to Baileys (session)
    const ownerId = conn.user?.id;

    // Safety: if we can't detect ownerId, deny
    if (!ownerId) return reply("❌ Unable to detect connected account. Try restarting the bot.");

    // Only the connected account can use this command
    if (sender !== ownerId) {
        return reply("❌ Only the connected WhatsApp account can use this command.");
    }

    const option = args[0]?.toString().toLowerCase();

    if (!option) {
        return reply("*Usage:*\n.chatbot on\n.chatbot off");
    }

    if (option === "on") {
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        return reply("🤖 Chatbot has been *enabled* for this chat.");
    }

    if (option === "off") {
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        return reply("🛑 Chatbot has been *disabled* for this chat.");
    }

    reply("❌ Invalid option. Use `.chatbot on` or `.chatbot off`");
});

/*  
────────────────────────────────────────
 AUTO REPLY HANDLER (NO TAG REQUIRED)
 Replies automatically when chatbot is ON for the chat.
────────────────────────────────────────
*/
async function chatbotAutoReply(conn, mek) {
    try {
        const chatId = mek.key.remoteJid;
        const data = loadUserGroupData();

        // Chatbot disabled for this chat?
        if (!data.chatbot[chatId]) return;

        // Basic text extraction
        let text =
            mek.message?.conversation ||
            mek.message?.extendedTextMessage?.text ||
            mek.message?.imageMessage?.caption ||
            mek.message?.videoMessage?.caption ||
            "";

        if (!text) return;

        const sender = mek.key.participant || mek.participant || mek.key.remoteJid;

        // Prevent bot replying to itself (avoid loops)
        const botId = conn.user?.id;
        if (!botId) return; // can't get bot id
        if (sender === botId) return;

        // Initialize memory for this sender if needed
        if (!chatMemory.messages.has(sender)) {
            chatMemory.messages.set(sender, []);
            chatMemory.userInfo.set(sender, {});
        }

        // Extract and save user info if present
        const info = extractUserInfo(text);
        if (Object.keys(info).length > 0) {
            chatMemory.userInfo.set(sender, {
                ...chatMemory.userInfo.get(sender),
                ...info
            });
        }

        // Store conversation history
        const logs = chatMemory.messages.get(sender);
        logs.push(text);
        if (logs.length > 20) logs.shift();

        // Show typing
        await showTyping(conn, chatId);

        // Build AI prompt
        const prompt = `
User Info: ${JSON.stringify(chatMemory.userInfo.get(sender))}
Chat History: ${logs.join("\n")}
User: ${text}
`;

        // Call AI
        const response = await giftedAI(prompt);

        // small natural delay
        await new Promise(r => setTimeout(r, randomDelay()));

        // Send reply (quoted to original message)
        await conn.sendMessage(chatId, { text: response }, { quoted: mek });

    } catch (err) {
        console.log("Chatbot error:", err);
    }
}

module.exports = chatbotAutoReply;
