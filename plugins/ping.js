const config = require('../config');
const { cmd } = require('../command');
const os = require('os');

// Popkids Verified Contact
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "POP KIDS VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:POP KIDS VERIFIED ✅
ORG:POP KIDS BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

// List of playful messages
const funMessages = [
  "💨 Zooming through!",
  "🚀 Rocket speed!",
  "⚡ Lightning fast!",
  "🎯 Bullseye!",
  "🔥 On fire!",
  "💎 Crystal clear ping!"
];

// Ping command
cmd({
    pattern: "ping",
    alias: ["speed","pong"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const start = Date.now();

        const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
        const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

        let reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
        let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];

        while (textEmoji === reactionEmoji) {
            textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
        }

        // Send reaction emoji
        await conn.sendMessage(from, { react: { text: textEmoji, key: mek.key } });

        const end = Date.now();
        const responseTime = end - start;

        // Bot uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const funMessage = funMessages[Math.floor(Math.random() * funMessages.length)];

        const text = `
┏━⊱ ⚡ *PING 😇* ⚡ ⊰━┓
┃  Response Time : ${responseTime}ms ${reactionEmoji}
┃  𝐔𝐏𝐓𝐈𝐌𝐄        : ${hours}h ${minutes}m ${seconds}s
┃  𝐒𝐓𝐀𝐓𝐔𝐒        : ${funMessage}
┗━━━━━━━━━━━━━━━━━┛
`;

        await conn.sendMessage(from, {
            text,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363289379419860@newsletter',
                    newsletterName: "popkid xtr",
                    serverMessageId: 143
                }
            }
        }, { quoted: quotedContact });

    } catch (e) {
        console.error("Error in ping command:", e);
        reply(`❌ An error occurred: ${e.message}`, quotedContact);
    }
});

// Ping2 command (advanced version)
cmd({
    pattern: "ping2",
    desc: "Check bot's response time in an advanced style.",
    category: "main",
    react: "🍂",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const startTime = Date.now();
        const message = await conn.sendMessage(from, { text: '⏳ *PINGING...*' }, { quoted: quotedContact });
        const endTime = Date.now();
        const ping = endTime - startTime;

        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const text = `
┏━⊱ 🍂 *𝙿𝙾𝙿𝙺𝙸𝙳 𝙼𝙳* 🍂 ⊰━┓
┃  Response Time : ${ping}ms
┃  𝐌𝐄𝐌𝐎𝐑𝐘😇  : ${memoryUsage} MB
┃  𝐇𝐎𝐒𝐓         : ${os.hostname()}
┗━━━━━━━━━━━━━━━━━━━━┛
`;

        await conn.sendMessage(from, { text }, { quoted: quotedContact });
    } catch (e) {
        console.log(e);
        reply(`❌ ${e}`, quotedContact);
    }
});
