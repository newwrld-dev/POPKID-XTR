const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// Memory to keep track of user conversations
const userChats = new Map();

// 1. COMMAND: Turn the chatbot ON/OFF
cmd({
    pattern: "chatbot",
    alias: ["bot", "ai"],
    desc: "Enable or Disable the Popkid MD Chatbot",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, text, isGroup }) => {
    try {
        const args = text?.split(' ') || [];
        const action = args[0]?.toLowerCase();
        
        if (!action) {
            return await conn.sendMessage(from, { 
                text: `🤖 *POPKID MD CHATBOT SETTINGS*\n\n` +
                      `*.chatbot on* - Turn ON everywhere\n` +
                      `*.chatbot off* - Turn OFF everywhere\n` +
                      `*.chatbot group on/off* - Toggle for Groups\n` +
                      `*.chatbot private on/off* - Toggle for Private DMs\n\n` +
                      `*Current Status:*\n` +
                      `• Group AI: ${config.GROUP_CHATBOT ? '✅ ACTIVE' : '❌ DISABLED'}\n` +
                      `• Private AI: ${config.PRIVATE_CHATBOT ? '✅ ACTIVE' : '❌ DISABLED'}`
            }, { quoted: mek });
        }
        
        if (action === 'on') {
            config.GROUP_CHATBOT = true; config.PRIVATE_CHATBOT = true;
            return await conn.sendMessage(from, { text: "✅ *Popkid MD Chatbot is now active everywhere!*" });
        }
        
        if (action === 'off') {
            config.GROUP_CHATBOT = false; config.PRIVATE_CHATBOT = false;
            return await conn.sendMessage(from, { text: "❌ *Popkid MD Chatbot is now disabled.*" });
        }

        // Logic for specific toggles (Group/Private)
        const target = action === 'group' ? 'GROUP_CHATBOT' : action === 'private' ? 'PRIVATE_CHATBOT' : null;
        if (target) {
            const status = args[1]?.toLowerCase() === 'on';
            config[target] = status;
            return await conn.sendMessage(from, { text: `${status ? '✅' : '❌'} *${action.toUpperCase()} Chatbot ${status ? 'Activated' : 'Deactivated'}!*` });
        }
        
    } catch (e) {
        console.error("Command Error:", e);
    }
});

// 2. HANDLER: Listens to incoming messages
module.exports.handleMessage = async (conn, m) => {
    try {
        const { body, from, isGroup, key, sender } = m;

        // STOP: Don't reply if it's my own message (fromMe)
        if (key.fromMe) return;

        // STOP: Don't reply if the text is a command
        if (!body || body.startsWith(config.PREFIX)) return;

        // CHECK: Is the chatbot enabled for this chat type?
        const isEnabled = (isGroup && config.GROUP_CHATBOT) || (!isGroup && config.PRIVATE_CHATBOT);
        if (!isEnabled) return;

        // EXECUTE: Get AI response
        await handleChatbotResponse(conn, m);
        
    } catch (e) {
        console.error("Handler Error:", e);
    }
};

// 3. AI ENGINE: Fetching from Srihub API
async function handleChatbotResponse(conn, m) {
    try {
        const { body, from, sender } = m;
        const userId = sender.split('@')[0];

        // System Identity Prompt
        const identity = "Your name is Popkid MD, created by Popkid. You are a helpful and friendly WhatsApp assistant.";
        
        // Build query using your specific API
        // API format: https://api.srihub.store/ai/chatgpt?apikey=YOUR_KEY&prompt=YOUR_PROMPT
        const apiKey = "dew_5H5Dbuh4v7NbkNRmI0Ns2u2ZK240aNnJ9lnYQXR9";
        const fullPrompt = `${identity}\n\nUser: ${body}`;
        
        const apiUrl = `https://api.srihub.store/ai/chatgpt?apikey=${apiKey}&prompt=${encodeURIComponent(fullPrompt)}`;

        const response = await axios.get(apiUrl, { timeout: 15000 });
        
        if (response.data && response.data.result) {
            await conn.sendMessage(from, { 
                text: response.data.result 
            }, { quoted: m });
        }
        
    } catch (e) {
        console.error("AI API Error:", e.message);
    }
}
