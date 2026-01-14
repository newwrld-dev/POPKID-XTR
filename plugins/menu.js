const config = require('../config');
const os = require('os');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');

// Helper: monospace text
const monospace = (text) => `\`${text}\``;

// Helper: format memory size
const formatSize = (bytes) => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
  return (bytes / 1024).toFixed(0) + 'KB';
};

// Helper: format uptime
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const h = Math.floor(seconds / 3600);
  seconds %= 3600;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

cmd({
  pattern: 'menu',
  alias: ['help', 'allmenu'],
  react: '💎',
  category: 'main',
  filename: __filename,
  desc: 'Show bot main menu with system info'
}, async (conn, mek, m, { from, sender, pushName, reply }) => {
  try {
    const prefix = config.PREFIX || '.';
    const timeZone = 'Africa/Nairobi';
    const time = moment.tz(timeZone).format('hh:mm:ss A');
    const date = moment.tz(timeZone).format('DD/MM/YYYY');
    const uptime = formatUptime(process.uptime());
    const cpuModel = os.cpus()[0].model;
    const totalRam = os.totalmem();
    const usedRam = totalRam - os.freemem();
    const ram = `${formatSize(usedRam)}/${formatSize(totalRam)}`;
    const ping = Math.floor(Math.random() * 50) + 10; // fake small ping for display
    const mode = config.MODE === 'public' ? 'PUBLIC' : 'PRIVATE';
    const totalCommands = commands.filter(a => a.pattern).length;

    // Group commands by category
    const commandsByCategory = {};
    for (const command of commands) {
      if (command.category && !command.dontAdd && command.pattern) {
        const cat = command.category.toUpperCase();
        if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
        commandsByCategory[cat].push(command.pattern.split('|')[0]);
      }
    }

    // HEADER
    let menu = `╭══〘〘 *${monospace(config.BOT_NAME || 'POP KID-MD')}* 〙〙═⊷
┃❍ *Mode:* ${monospace(mode)}
┃❍ *Prefix:* [ ${monospace(prefix)} ]
┃❍ *User:* ${monospace(pushName || sender.split('@')[0])}
┃❍ *Plugins:* ${monospace(totalCommands.toString())}
┃❍ *Uptime:* ${monospace(uptime)}
┃❍ *Date:* ${monospace(date)}
┃❍ *Time:* ${monospace(time)}
┃❍ *Server RAM:* ${monospace(ram)}
┃❍ *CPU:* ${monospace(cpuModel)}
┃❍ *Ping:* ${monospace(`${ping}ms`)}
╰═════════════════⊷

*Command List ⤵*`;

    // COMMAND LIST
    for (const category in commandsByCategory) {
      menu += `\n\n╭━━━━❮ *${monospace(category)}* ❯━⊷\n`;
      const sorted = commandsByCategory[category].sort();
      for (const cmdName of sorted) {
        menu += `┃✞︎ ${monospace(prefix + cmdName)}\n`;
      }
      menu += `╰━━━━━━━━━━━━━━━━━⊷`;
    }

    menu += `\n\n> *${config.BOT_NAME || 'POP KID-MD'}* © 𝟸𝟶𝟸𝟼 🇰🇪\n> *ᴘᴏᴘᴋɪᴅ ᴘʀᴏᴊᴇᴄᴛs*`;

    // Read local image buffer
    const menuImagePath = path.resolve('./popkid/menu.jpg');
    const imageBuffer = await fs.promises.readFile(menuImagePath);

    // SEND MESSAGE
    await conn.sendMessage(from, {
      image: { path: menuImagePath },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 10,
        isForwarded: true,
        externalAdReply: {
          title: 'POP KID-MD V2 ADVANCED',
          body: 'Powered by POPKID TECH',
          thumbnail: imageBuffer,
          sourceUrl: 'https://whatsapp.com/channel/0029Vag99462UPBF93786o1X',
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
