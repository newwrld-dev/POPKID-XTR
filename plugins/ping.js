const config = require('../config');
const { cmd, commands } = require('../command');

cmd({
    pattern: "ping",
    alias: ["p", "speed"],
    desc: "Check bot response speed.",
    category: "info",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();
        
        // Initial "Testing..." reaction or message
        const message = await conn.sendMessage(from, { text: '✞︎ *𝐏𝐈𝐍𝐆𝐈𝐍𝐆...*' }, { quoted: mek });
        
        const endTime = Date.now();
        const ping = endTime - startTime;

        // Stylish Ping Message
        let status = `╔═══════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐒𝐏𝐄𝐄𝐃* ✰
╚═══════════════╝
┌─────────────────┐
│ ✞︎ **ᴘᴏɴɢ:** ${ping}ᴍs
│ ✞︎ **sᴛᴀᴛᴜs:** ᴇxᴄᴇʟʟᴇɴᴛ ✅
│ ✞︎ **ʟᴀᴛᴇɴᴄʏ:** sᴛᴀʙʟᴇ
└─────────────────┘
━━━━━━━━━━━━━━━━━━━━
✰ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ* ✰
━━━━━━━━━━━━━━━━━━━━`;

        // Send the image along with the stylish status
        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/1v65x6.jpg' },
            caption: status
        });

        // Optionally delete the "Pinging..." message
        await conn.sendMessage(from, { delete: message.key });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
