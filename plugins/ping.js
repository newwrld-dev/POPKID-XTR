const { cmd } = require('../command');

cmd({
    pattern: "ping",
    desc: "Check bot speed",
    category: "main",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from }) => {
    try {
        const start = Date.now();
        
        // Send the initial short message
        const message = await conn.sendMessage(from, { text: "⚡" });
        
        const end = Date.now();
        const latency = end - start;

        // Edit into the final stylish result
        await conn.sendMessage(from, { 
            text: `*🐁ᴘᴏᴘᴋɪᴅ ᴍᴅ sᴘᴇᴇᴅ:* ${latency}ms`, 
            edit: message.key 
        });

    } catch (e) {
        console.log("Ping Error:", e);
    }
});
