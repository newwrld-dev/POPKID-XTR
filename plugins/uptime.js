const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "uptime",
    alias: ["status", "runtime", "botstatus"],
    desc: "Check how long the bot has been active.",
    category: "info",
    react: "⏳",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        // Calculate Runtime
        const run = runtime(process.uptime());
        
        // System Information
        const totalRAM = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2); // GB
        const freeRAM = (os.freemem() / 1024 / 1024 / 1024).toFixed(2); // GB
        const usedRAM = (totalRAM - freeRAM).toFixed(2);
        const cpuModel = os.cpus()[0].model.split(' ')[0]; // Short CPU name

        // Stylish Uptime Message
        let status = `╔════════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐒𝐓𝐀𝐓𝐔𝐒* ✰
╚════════════════╝
┌────────────────┐
│ ✞︎ *ʀᴜɴᴛɪᴍᴇ:* ${run}
│ ✞︎ *sᴇʀᴠᴇʀ:* ${os.platform()} (${os.arch()})
│ ✞︎ *ᴄᴘᴜ:* ${cpuModel}
│ ✞︎ *ʀᴀᴍ:* ${usedRAM}GB / ${totalRAM}GB
│ ✞︎ *ʟᴏᴀᴅ:* ${(os.loadavg()[0]).toFixed(2)}%
└────────────────┘
━━━━━━━━━━━━━━━━━━
✰ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ* ✰
━━━━━━━━━━━━━━━━━━`;

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
            caption: status,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.NEWSLETTER_JID || '120363289379419860@newsletter',
                    newsletterName: "『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐒𝐘𝐒𝐓𝐄𝐌 』",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e.message}`);
    }
});
