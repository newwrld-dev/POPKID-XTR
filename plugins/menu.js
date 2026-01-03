const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

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
    const prefix = getPrefix();
    const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');
    const date = moment.tz('Africa/Nairobi').format('DD/MM/YYYY');
    const hour = moment.tz('Africa/Nairobi').hour();
    
    const greeting = hour < 12 ? "Good Morning 🌅" : hour < 17 ? "Good Afternoon ☀️" : "Good Evening 🌙";
    
    const start = new Date().getTime();
    const end = new Date().getTime();
    const ping = end - start;

    const cpuModel = os.cpus()[0].model.split(' ')[0];
    const mode = config.MODE === 'public' ? 'Public' : 'Private';
    
    const commandsByCategory = {};
    commands.forEach(command => {
      if (command.category && !command.dontAdd && command.pattern) {
        const cat = command.category.charAt(0).toUpperCase() + command.category.slice(1);
        if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
        commandsByCategory[cat].push(command.pattern.split('|')[0]);
      }
    });

    // === ADVANCED SCENE-MD HEADER ===
    let menu = `▓│ *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* │▓
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
│▓│▸ *Commands* : ${commands.length}
│▓│▸ *Theme* : *POPKID-MD*
│▓└───────────────···▸
╚══════ ▓▓ ࿇ ▓▓ ══════╝
> ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴀɪ ʙʏ ᴘᴏᴘᴋɪᴅ 🇰🇪

 ▓ *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴄᴏᴍᴍᴀɴᴅs* ▓ \n\n`; 

    for (const category in commandsByCategory) {
      menu += `╔═══❏ ${category} ❏══╗\n│❒┌─────···▸`;
      for (const cmdName of commandsByCategory[category].sort()) {
        menu += `\n│❒│ ${prefix}${cmdName}`;
      }
      menu += `\n│❒└────────···▸\n╚════════════════╝\n`;
    }

    menu += `
╔═══════
> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ʙᴏᴛ* © 𝐏𝐨𝐩𝐤𝐢𝐝 𝐓𝐞𝐜𝐡 𝟐𝟎𝟐𝟔🇰🇪
╚═════ ▓▓ ࿇ ▓▓ ═════╝`;

    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
      caption: menu,
      contextInfo: {
        mentionedJid: [sender],
        isForwarded: true,
        forwardingScore: 999,
        externalAdReply: {
          title: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ2 ᴀᴅᴠᴀɴᴄᴇᴅ sʏsᴛᴇᴍ",
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
    reply(`❌ Error: ${e.message}`);
  }
});
