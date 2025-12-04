const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');
const fs = require('fs');
const path = require('path');

// Quoted Contact Message (from BMB style)
const quotedContact = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "ᴘᴏᴘᴋɪᴅ VERIFIED ✅",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:ᴘᴏᴘᴋɪᴅ VERIFIED ✅
ORG:POP KID BOT;
TEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER || '0000000000'}:+${config.OWNER_NUMBER || '0000000000'}
END:VCARD`
    }
  }
};

// Stylize uppercase letters
function toUpperStylized(str) {
  const stylized = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
    Y: 'ʏ', Z: 'ᴢ'
  };
  return str.split('').map(c => stylized[c.toUpperCase()] || c).join('');
}

// Normalize category names
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Emoji by category
const emojiByCategory = {
  ai: '🤖',
  anime: '🍥',
  audio: '🎧',
  bible: '📖',
  download: '⬇️',
  downloader: '📥',
  fun: '🎮',
  game: '🕹️',
  group: '👥',
  img_edit: '🖌️',
  info: 'ℹ️',
  information: '🧠',
  logo: '🖼️',
  main: '🏠',
  media: '🎞️',
  menu: '📜',
  misc: '📦',
  music: '🎵',
  other: '📁',
  owner: '👑',
  privacy: '🔒',
  search: '🔎',
  settings: '⚙️',
  sticker: '🌟',
  tools: '🛠️',
  user: '👤',
  utilities: '🧰',
  utility: '🧮',
  wallpapers: '🖼️',
  whatsapp: '📱',
};

cmd({
  pattern: 'menu',
  alias: ['allmenu'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '🪀',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const timezone = config.TIMEZONE || 'Africa/Nairobi';
    const time = moment().tz(timezone).format('HH:mm:ss');
    const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let m = Math.floor((sec % 3600) / 60);
      let s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    // Random menu image (BMB style)
    const randomIndex = Math.floor(Math.random() * 10) + 1;
    const imagePath = path.join(__dirname, '..', 'plugins', `menu${randomIndex}.jpg`);
    let imageBuffer;
    try { imageBuffer = fs.readFileSync(imagePath); } catch { imageBuffer = null; }

    // Menu header (BMB style)
    let menu = `
╭━━━《 ⚙️ ᴘᴏᴘᴋɪᴅ BOT ⚙️ 》━━━┈⊷
┃▸ User     : @${sender.split("@")[0]}
┃▸ Runtime  : ${uptime()}
┃▸ Mode     : ${config.MODE}
┃▸ Prefix   : ${config.PREFIX}
┃▸ Owner    : ${config.OWNER_NAME}
┃▸ Plugins  : ${commands.length}
┃▸ Dev      : ᴘᴏᴘᴋɪᴅ
┃▸ Version  : 2.0.0
╰━━━━━━━━━━━━━━━━━━┈⊷`;

    // Group commands by category (Popkid dynamic style)
    const categories = {};
    for (const cmd of commands) {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const cat = normalize(cmd.category);
        categories[cat] = categories[cat] || [];
        categories[cat].push(cmd.pattern.split('|')[0]);
      }
    }

    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '🧛‍♂️';
      menu += `\n\n┏─『 ${emoji} ${toUpperStylized(cat)} ${toUpperStylized('Menu')} 』──⊷\n`;
      for (const c of categories[cat].sort()) {
        menu += `│ ${prefix}${c}\n`;
      }
      menu += `┗──────────────⊷`;
    }

    menu += `\n\n> ${config.DESCRIPTION || toUpperStylized('Explore the bot commands!')}`;

    // Send menu
    await conn.sendMessage(
      from,
      {
        image: imageBuffer ? { buffer: imageBuffer } : { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
        caption: menu,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JID || '120363289379419860@newsletter',
            newsletterName: config.OWNER_NAME || toUpperStylized('popkid'),
            serverMessageId: 143
          }
        }
      },
      { quoted: quotedContact }
    );

    // Send audio if configured
    if (config.MENU_AUDIO_URL) {
      await new Promise(r => setTimeout(r, 1000));
      await conn.sendMessage(
        from,
        {
          audio: { url: config.MENU_AUDIO_URL },
          mimetype: 'audio/mp4',
          ptt: true,
          contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterName: config.OWNER_NAME || toUpperStylized('popkid'),
              serverMessageId: 143
            }
          }
        },
        { quoted: quotedContact }
      );
    }

  } catch (e) {
    console.error('Menu Error:', e.message);
    await reply(`❌ ${toUpperStylized('Error')}: Failed to show menu.\n${toUpperStylized('Details')}: ${e.message}`);
  }
});
