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
    const hour = moment.tz('Africa/Nairobi').hour();
    const greeting =
      hour < 12 ? 'GOOD MORNING' :
      hour < 17 ? 'GOOD AFTERNOON' :
      'GOOD EVENING';

    const start = performance.now();
    const cpuModel = os.cpus()[0].model;
    const totalRam = os.totalmem();
    const usedRam = totalRam - os.freemem();
    const ping = (performance.now() - start).toFixed(0);
    const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';

    const commandsByCategory = {};
    commands.forEach(command => {
      if (command.category && !command.dontAdd && command.pattern) {
        const cat = command.category.toUpperCase();
        if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
        commandsByCategory[cat].push(command.pattern.split('|')[0]);
      }
    });

    // Header box (same layout as your screenshot)
    let menu = `┌──〔 *POP KID-MD* 〕───
│⚡ *USER*: @${sender.split('@')[0]}
│⚡ *STATUS*: ${greeting}
│⚡ *MODE*: ${mode} 🚀
│⚡ *PING*: ${ping}MS
│📅 *DATE*: ${date}
│🕒 *TIME*: ${time}
│💾 *RAM*: ${formatSize(usedRam)}/${formatSize(totalRam)}
│💻 *CPU*: ${cpuModel}
│⚙️ *CMDS*: ${commands.length}
└────────────────────`;

    menu += `\n\n*COMMAND LIST ⤵*`;

    // Command list per category
    for (const category in commandsByCategory) {
      menu += `\n\n┏━━〔 *${category}* 〕━━┈⊷\n`;
      const sorted = commandsByCategory[category].sort();
      for (const name of sorted) menu += `┃ ✦ ${prefix}${name}\n`;
      menu += `┗━━━━━━━━━━━━━━━┈⊷`;
    }

    menu += `\n\n> *POP KID-MD* © POPKID TECH 2026 🇰🇪`;

    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        externalAdReply: {
          title: 'POP KID-MD V2 ADVANCED',
          body: 'Powered by POPKID TECH',
          thumbnailUrl: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg',
          sourceUrl: 'https://whatsapp.com/channel/0029Vag99462UPBF93786o1X',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply('❌ Error: ' + e.message);
  }
});
