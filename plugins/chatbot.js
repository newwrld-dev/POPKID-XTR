const { cmd } = require('../command');
const fetch = require('node-fetch');

// This variable stays in the bot's memory while it is running
let chatbotStatus = false; 

cmd({
    pattern: "chatbot",
    alias: ["autoai", "ai"],
    react: "🤖",
    desc: "Toggle and manage the Auto AI Chatbot.",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isCreator, body, pushName }) => {
    
    // --- PART 1: THE TOGGLE (OWNER ONLY) ---
    if (q === "on") {
        if (!isCreator) return reply("🚫 *Owner only!*");
        chatbotStatus = true;
        return await reply("✅ *AI Chatbot Activated!* I will now reply to all private messages.");
    }

    if (q === "off") {
        if (!isCreator) return reply("🚫 *Owner only!*");
        chatbotStatus = false;
        return await reply("❌ *AI Chatbot Deactivated.*");
    }

    // --- PART 2: THE AUTO-RESPONSE LOGIC ---
    // This runs if the chatbot is ON and the user is NOT sending a command
    if (chatbotStatus && !body.startsWith('.') && !m.key.fromMe) {
        
        // Don't reply in groups to avoid spam
        const isGroup = from.endsWith('@g.us');
        if (isGroup) return;

        try {
            // Show "typing..." for realism
            await conn.sendPresenceUpdate('composing', from);

            const apiUrl = `https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(body)}&apikey=`; // Add key if you have one
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.success || data.status === 200) {
                const aiMsg = data.result;
                
                await conn.sendMessage(from, { 
                    text: `*Hi ${pushName}* ✨\n\n${aiMsg}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴅ ᴀɪ 🤖` 
                }, { quoted: mek });
            }
        } catch (e) {
            console.log("AI Error: ", e);
        }
    } else if (!q) {
        // Simple status check if user just types .chatbot
        await reply(`🤖 *Chatbot Status:* ${chatbotStatus ? "ACTIVE ✅" : "OFFLINE ❌"}\n\n*Commands:*\n.chatbot on\n.chatbot off`);
    }
});
