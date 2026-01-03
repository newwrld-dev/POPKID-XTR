const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
    return (bytes / 1024).toFixed(0) + 'KB';
};

cmd({
  pattern: 'menu',
  alias: ['allmenu', 'help'],
  react: '💎',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');
    const date = moment.tz('Africa/Nairobi').format('DD/MM/YY');
    const greeting = moment.tz('Africa/Nairobi').hour() < 12 ? "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ" : moment.tz('Africa/Nairobi').hour() < 17 ? "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ" : "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ";
    
    const start = Date.now();
    const ping = Date.now() - start;
    const cpuModel = os.cpus()[0].model.split(' ')[0];
    
    const commandsByCategory = {};
    commands.forEach(command => {
      if (command.category && !command.dontAdd && command.pattern) {
        const cat = command.category.toUpperCase();
        if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
        commandsByCategory[cat].push(command.pattern.split('|')[0]);
      }
    });

    const categoryKeys = Object.keys(commandsByCategory).sort();

    // Prepare cards for scrolling
    const cards = categoryKeys.map((category) => {
      const cmdList = commandsByCategory[category].sort().map(cmdName => `┃ ✦ ${prefix}${cmdName}`).join('\n');

      return {
        header: {
          imageMessage: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
          hasMediaAttachment: true,
        },
        body: { text: `┏━━〔 *${category}* 〕━━┈⊷\n${cmdList}\n┗━━━━━━━━━━━━━━━┈⊷` },
        footer: { text: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ" },
        nativeFlowMessage: {
          buttons: [] // No buttons as requested
        }
      };
    });

    const headerText = `┏━━━━━━〔 *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* 〕━━━━━━┈⊷
┃ ⚡ *ᴜsᴇʀ*: @${sender.split("@")[0]}
┃ ⚡ *sᴛᴀᴛᴜs*: ${greeting}
┃ 🚀 *ᴘɪɴɢ*: ${ping}ᴍs | 📅 *ᴅᴀᴛᴇ*: ${date}
┃ 🕒 *ᴛɪᴍᴇ*: ${time} | ⚙️ *ᴄᴍᴅs*: ${commands.length}
┃ 📟 *ʀᴀᴍ*: ${formatSize(os.totalmem() - os.freemem())}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┈⊷

↔️ *sᴡɪᴘᴇ ʟᴇғᴛ/ʀɪɢʜᴛ ᴛᴏ ᴠɪᴇᴡ ᴘᴀɢᴇs*`;

    // The Interactive Message structure
    const interactiveMessage = {
      body: { text: headerText },
      footer: { text: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ𝟸 ᴇᴅɪᴛɪᴏɴ" },
      carouselMessage: {
        cards: cards
      }
    };

    // Sending as viewOnce to ensure media type compatibility
    return await conn.sendMessage(from, {
      viewOnceMessage: {
        message: {
          interactiveMessage: interactiveMessage
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error(e);
    // Ultimate fallback if media still fails: send text version
    reply(`❌ Error: ${e.message}\nTry checking your MENU_IMAGE_URL.`);
  }
});
