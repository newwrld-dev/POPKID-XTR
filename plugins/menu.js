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

// Invisible "Read More" character (enough to trigger WhatsApp collapse)
const readMore = String.fromCharCode(8206).repeat(400);

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
    const hour = moment.tz('Africa/Nairobi').hour();
    const greeting = hour < 12 ? "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ" : hour < 17 ? "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ" : "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ";

    const start = Date.now();
    const ping = Date.now() - start;

    const cpuModel = os.cpus()[0].model; // full CPU model
    const mode = config.MODE === 'public' ? 'ᴘᴜʙʟɪᴄ' : 'ᴘʀɪᴠᴀᴛᴇ';

    // Organize commands by category
    const commandsByCategory = {};
    commands.forEach(command => {
      if (command.category && !command.dontAdd && command.pattern) {
        const cat = command.category.toUpperCase();
        if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
        commandsByCategory[cat].push(command.pattern.split('|')[0]);
      }
    });

    // Menu header
    let menu = `┏━━〔 *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* 〕━━┈⊷
┃⚡ *ᴜsᴇʀ*: @${sender.split("@")[0]}
┃⚡ *sᴛᴀᴛᴜs*: ${greeting}
┃⚡ *ᴍᴏᴅᴇ*: ${mode}
┃🚀 *ᴘɪɴɢ*: ${ping}ᴍs
┃📅 *ᴅᴀᴛᴇ*: ${date}
┃🕒 *ᴛɪᴍᴇ*: ${time}
┃📟 *ʀᴀᴍ*: ${formatSize(os.totalmem() - os.freemem())}/${formatSize(os.totalmem())}
┃💻 *ᴄᴘᴜ*: ${cpuModel}
┃⚙️ *ᴄᴍᴅs*: ${commands.length}
┗━━━━━━━━━━━━━━━┈⊷
${readMore}\n\n*ᴄᴏᴍᴍᴀɴᴅ ʟɪsᴛ* ⤵`;

    // Add commands by category
    for (const category in commandsByCategory) {
      menu += `\n\n┏━━〔 *${category}* 〕━━┈⊷\n`;
      const sortedCmds = commandsByCategory[category].sort();
      for (const cmdName of sortedCmds) {
        menu += `┃ ✦ ${prefix}${cmdName}\n`;
      }
      menu += `┗━━━━━━━━━━━━━━━┈⊷`;
    }

    // Footer
    menu += `\n\n> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ* © ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ 𝟸𝟶𝟸𝟼🇰🇪`;

    // Send menu as image with rich preview
    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        isForwarded: false,
        forwardingScore: 0,
        externalAdReply: {
          title: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ2 ᴀᴅᴠᴀɴᴄᴇᴅ",
          body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ",
          thumbnailUrl: config.MENU_IMAGE_URL || "https://files.catbox.moe/kiy0hl.jpg",
          sourceUrl: "https://whatsapp.com/channel/0029Vag99462UPBF93786o1X",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
