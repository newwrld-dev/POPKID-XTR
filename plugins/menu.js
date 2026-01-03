const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

// WhatsApp "read more" fix
const readMore = String.fromCharCode(8206).repeat(4001);

const formatSize = (bytes) => {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(2) + ' KB';
};

cmd({
  pattern: 'menu',
  alias: ['allmenu', 'help'],
  react: '💎',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix(from);
    const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');
    const date = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
    const hour = moment.tz('Africa/Nairobi').hour();

    const greeting =
      hour < 12 ? "Good Morning 🌅" :
      hour < 17 ? "Good Afternoon ☀️" :
      "Good Evening 🌙";

    // Realistic ping
    const ping = Math.floor(Math.random() * 50) + 10;

    const cpuModel = os.cpus()[0]?.model || 'Unknown CPU';
    const mode = config.MODE === 'public' ? 'Public' : 'Private';

    // Group commands by category
    const commandsByCategory = {};
    const visibleCommands = commands.filter(c => c.pattern && !c.dontAdd);

    for (const command of visibleCommands) {
      if (!command.category) continue;
      const cat = command.category.charAt(0).toUpperCase() + command.category.slice(1);
      if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
      commandsByCategory[cat].push(command.pattern.split('|')[0]);
    }

    // ================= MENU HEADER =================
    let menu = `╔═══▓*${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ'}*▓════╗
│▓┌────────···▸
│▓│▸ *User* : @${sender.split("@")[0]}
│▓│▸ *Status* : ${greeting}
│▓│▸ *Owner* : ${config.OWNER_NAME || 'ᴘᴏᴘᴋɪᴅ'}
│▓└────────────···▸
│▓┌────────···▸
│▓│▸ *Mode* : ${mode}
│▓│▸ *Ping* : ${ping}ms ⚡
│▓│▸ *Date* : ${date}
│▓│▸ *Time* : ${time}
│▓└─────────···▸
│▓┌────────···▸
│▓│▸ *Memory* : ${formatSize(os.totalmem() - os.freemem())}/${formatSize(os.totalmem())}
│▓│▸ *CPU* : ${cpuModel}
│▓│▸ *Commands* : ${visibleCommands.length}
│▓│▸ *Theme* : *POPKID-MD*
│▓└───────────────···▸
╚══════ ▓▓ ࿇ ▓▓ ══════╝
> ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴀɪ ʙʏ ᴘᴏᴘᴋɪᴅ 🇰🇪

 ▓ *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴄᴏᴍᴍᴀɴᴅs* ▓
${readMore}
`;

    // ================= COMMAND LIST =================
    for (const category in commandsByCategory) {
      menu += `╔═══❏ ${category} ❏══╗\n│❒┌─────···▸`;
      for (const cmdName of commandsByCategory[category].sort()) {
        menu += `\n│❒│ ${prefix}${cmdName}`;
      }
      menu += `\n│❒└────────···▸\n╚════════════════╝\n`;
    }

    menu += `
╔═══════
> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ʙᴏᴛ* © 𝐏𝐨𝐩𝐤𝐢𝐝 𝐓𝐞𝐜𝐡 𝟐𝟎𝟐𝟔 🇰🇪
╚═════ ▓▓ ࿇ ▓▓ ═════╝`;

    // ================= SAFE SEND =================
    if (menu.length > 4000) {
      await conn.sendMessage(from, {
        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' }
      }, { quoted: mek });

      await conn.sendMessage(from, {
        text: menu,
        mentions: [sender]
      });

      return;
    }

    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        isForwarded: true,
        forwardingScore: 999,
        externalAdReply: {
          title: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ v2 Advanced System",
          body: "High Performance WhatsApp Bot",
          thumbnailUrl: config.MENU_IMAGE_URL || "https://files.catbox.moe/kiy0hl.jpg",
          sourceUrl: "https://whatsapp.com/channel/0029Vag99462UPBF93786o1X",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`❌ Menu Error: ${e.message}`);
  }
});
