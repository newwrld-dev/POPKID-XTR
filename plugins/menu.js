const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

cmd({
  pattern: 'menu',
  alias: ['allmenu', 'help', 'panel'],
  react: '💎',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');
    const date = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
    
    // RAM Progress Bar Calculation
    const usedRam = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalRam = os.totalmem() / 1024 / 1024;
    const ramPercentage = Math.round((usedRam / totalRam) * 100);
    const progressBar = "▓".repeat(Math.round(ramPercentage / 10)) + "░".repeat(10 - Math.round(ramPercentage / 10));

    // Advanced Header with Neon Styling
    let menu = `✨ *Wᴇʟᴄᴏᴍᴇ Tᴏ Pᴏᴘᴋɪᴅ-MD V2* ✨

┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ *Sʏsᴛᴇᴍ Sᴛᴀᴛᴜs Pᴀɴᴇʟ* ⚡
┗━━━━━━━━━━━━━━━━━━━━━━━┛
┌─────────────────────┐
  👤 *Usᴇʀ:* @${sender.split("@")[0]}
  🏅 *Rᴀɴᴋ:* Premium User
  ⏳ *Uᴘᴛɪᴍᴇ:* ${process.uptime().toFixed(0)}s
  🔋 *RAM:* [${progressBar}] ${ramPercentage}%
  🌍 *Lᴏᴄᴀᴛɪᴏɴ:* Kenya 🇰🇪
└─────────────────────┘

*ᴄᴜʀʀᴇɴᴛ ᴛɪᴍᴇ:* ${time} | ${date}
━━━━━━━━━━━━━━━━━━━━━━━`;

    // Grouping & Styling Categories
    const categories = {};
    commands.forEach(cmd => {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const cat = cmd.category.toUpperCase();
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(cmd.pattern.split('|')[0]);
      }
    });

    // Elegant Boxed Category Layout
    Object.keys(categories).sort().forEach(cat => {
      menu += `\n\n╭━━〔 *${cat}* 〕━━┈⊷\n┃\n`;
      const categoryCmds = categories[cat].sort();
      
      // Multi-column row styling
      for (let i = 0; i < categoryCmds.length; i += 2) {
        const cmd1 = `🔹 ${prefix}${categoryCmds[i]}`;
        const cmd2 = categoryCmds[i+1] ? `🔹 ${prefix}${categoryCmds[i+1]}` : "";
        menu += `┃ ${cmd1.padEnd(15)} ${cmd2}\n`;
      }
      
      menu += `┃\n╰━━━━━━━━━━━━━┈⊷`;
    });

    menu += `\n\n> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ* 🤖`;

    // Sending with a high-quality "Card" feel
    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        isForwarded: true,
        forwardingScore: 999,
        externalAdReply: {
          title: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ2 ᴀᴅᴠᴀɴᴄᴇᴅ ᴘᴀɴᴇʟ",
          body: "Created by Popkid Kenya",
          thumbnailUrl: "https://files.catbox.moe/kiy0hl.jpg",
          sourceUrl: "https://github.com/Popkid-Tech",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    reply(`❌ Error: ${e.message}`);
  }
});
