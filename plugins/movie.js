const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// Conversation memory
const userChats = new Map();

// Command to Turn Chatbot ON/OFF
cmd({
    pattern: "chatbot",
    alias: ["bot", "ai"],
    desc: "On/Off chatbot for groups or private",
    category: "ai",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, text, isGroup, sender }) => {
    try {
        const args = text?.split(' ') || [];
        const action = args[0]?.toLowerCase();
        
        if (!action) {
            return await conn.sendMessage(from, { 
                text: `🤖 *CHATBOT SETTINGS*\n\n` +
                      `*.chatbot on* - Turn ON chatbot (All)\n` +
                      `*.chatbot off* - Turn OFF chatbot (All)\n` +
                      `*.chatbot group on* - Turn ON for group only\n` +
                      `*.chatbot group off* - Turn OFF for group\n` +
                      `*.chatbot private on* - Turn ON for private\n` +
                      `*.chatbot private off* - Turn OFF for private\n\n` +
                      `*Current Status:*\n` +
                      `• Group Chatbot: ${config.GROUP_CHATBOT ? '✅ ON' : '❌ OFF'}\n` +
                      `• Private Chatbot: ${config.PRIVATE_CHATBOT ? '✅ ON' : '❌ OFF'}`
            }, { quoted: mek });
        }
        
        if (action === 'on') {
            config.GROUP_CHATBOT = true;
            config.PRIVATE_CHATBOT = true;
            return await conn.sendMessage(from, { text: `✅ *Chatbot turned ON for Group and Private!*` }, { quoted: mek });
        }
        
        if (action === 'off') {
            config.GROUP_CHATBOT = false;
            config.PRIVATE_CHATBOT = false;
            return await conn.sendMessage(from, { text: `❌ *Chatbot turned OFF for Group and Private!*` }, { quoted: mek });
        }
        
        if (action === 'group') {
            const subAction = args[1]?.toLowerCase();
            if (subAction === 'on') {
                config.GROUP_CHATBOT = true;
                return await conn.sendMessage(from, { text: `✅ *Group Chatbot is now ON!*` }, { quoted: mek });
            } else if (subAction === 'off') {
                config.GROUP_CHATBOT = false;
                return await conn.sendMessage(from, { text: `❌ *Group Chatbot is now OFF!*` }, { quoted: mek });
            }
        }
        
        if (action === 'private') {
            const subAction = args[1]?.toLowerCase();
            if (subAction === 'on') {
                config.PRIVATE_CHATBOT = true;
                return await conn.sendMessage(from, { text: `✅ *Private Chatbot is now ON!*` }, { quoted: mek });
            } else if (subAction === 'off') {
                config.PRIVATE_CHATBOT = false;
                return await conn.sendMessage(from, { text: `❌ *Private Chatbot is now OFF!*` }, { quoted: mek });
            }
        }
        
    } catch (e) {
        console.error("Chatbot command error:", e);
    }
});

// System to capture and handle incoming messages
module.exports.handleMessage = async (conn, m) => {
    try {
        const { body, from, isGroup, key } = m;

        // CRITICAL FIX: Ignore if the message is from the bot itself
        if (key.fromMe) return;

        const message = body?.toLowerCase()?.trim();
        if (!message) return;
        
        // Skip if message is a command
        if (message.startsWith(config.PREFIX)) return;
        
        // Handle Group logic
        if (isGroup && config.GROUP_CHATBOT) {
            await handleChatbotResponse(conn, m, true);
        }
        
        // Handle Private logic
        if (!isGroup && config.PRIVATE_CHATBOT) {
            await handleChatbotResponse(conn, m, false);
        }
        
    } catch (e) {
        console.error("Chatbot handler error:", e);
    }
};

// Function to generate and send AI response
async function handleChatbotResponse(conn, m, isGroup) {
    try {
        const { body, from, sender, key } = m;

        // Extra safety check to prevent infinite loops
        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';
        if (key.fromMe || sender === botId) return;

        const userId = sender.split('@')[0];
        const userMessage = body.trim();
        
        // Initialize memory for user
        if (!userChats.has(userId)) {
            userChats.set(userId, []);
        }
        
        const userConversation = userChats.get(userId);
        userConversation.push(`User: ${userMessage}`);
        
        // Keep only last 10 messages for memory context
        if (userConversation.length > 10) {
            userConversation.shift();
        }
        
        const context = userConversation.join('\n');
        
        // Fetch response from AI
        const aiResponse = await getAIResponse(userMessage, context, isGroup);
        
        if (aiResponse) {
            userConversation.push(`AI: ${aiResponse}`);
            
            // Send the reply back
            await conn.sendMessage(from, { 
                text: aiResponse 
            }, { quoted: m });
        }
        
    } catch (e) {
        console.error("Chatbot response error:", e);
    }
}

// AI API Logic
async function getAIResponse(message, context, isGroup) {
    try {
        // Attempt API 1: Dark API
        try {
            const response = await axios.post('https://darkapi--hfproject.hf.space/chat', {
                message: message,
                context: context
            }, { timeout: 10000 });
            
            if (response.data?.response) return response.data.response;
        } catch (e) {}

        // Attempt API 2: ChatGPT Free
        try {
            const response = await axios.get(`https://api.azz.biz.id/api/chatgpt?q=${encodeURIComponent(message)}&key=free`, {
                timeout: 10000
            });
            
            if (response.data?.respon) return response.data.respon;
        } catch (e) {}
        
        // Fallback Responses
        const fallbacks = [
            "I see! Tell me more.",
            "That's interesting, go on.",
            "I'm listening!",
            "I understand.",
            "Thanks for sharing that with me."
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        
    } catch (error) {
        console.error("AI API failure:", error);
        return "I'm having a little trouble thinking right now. Could you try again?";
    }
}
