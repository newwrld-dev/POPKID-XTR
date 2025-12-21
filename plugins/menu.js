const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');
const fs = require('fs');
const path = require('path');

// Quoted Contact Message (Verified Style)
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
  download: '📥',
  fun: '🎮',
  group: '👥',
  info: '🧠',
  main: '🏠',
  music: '🎵',
  owner: '👑',
  search: '🔎',
  settings: '⚙️',
  sticker: '🌟',
  tools: '🛠️',
};

cmd({
  pattern: 'menu',
  alias: ['allmenu'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '⚡',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let m = Math.floor((sec % 3600) / 60);
      let s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    // --- STYLIZED MENU HEADER ---
    let menu = `╔══════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝟐* ✰
╚══════════════╝
┌───────────────┐
│ ✞︎ *ᴜsᴇʀ:* @${sender.split("@")[0]}
│ ✞︎ *ᴜᴘᴛɪᴍᴇ:* ${uptime()}
│ ✞︎ *ᴍᴏᴅᴇ:* ${config.MODE}
│ ✞︎ *ᴘʀᴇғɪx:* ${prefix}
│ ✞︎ *ᴘʟᴜɢɪɴs:* ${commands.length}
└────────────────┘
━━━━━━━━━━━━━━━━`;

    // Group commands by category
    const categories = {};
    for (const cmd of commands) {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const cat = normalize(cmd.category);
        categories[cat] = categories[cat] || [];
        categories[cat].push(cmd.pattern.split('|')[0]);
      }
    }

    // --- DYNAMIC CATEGORY BOXES ---
    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '✨';
      menu += `\n\n╭━〔 ${emoji} *${toUpperStylized(cat)}* 〕━━┈⊷\n`;
      
      const categoryCmds = categories[cat].sort();
      for (const c of categoryCmds) {
        menu += `┃  ✞︎ ${prefix}${c}\n`;
      }
      
      menu += `╰━━━━━━━━━━━━━━━┈⊷`;
    }

    menu += `\n\n  ✰ **ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ** ✰\n   Stay smart • Clean • Advanced\n━━━━━━━━━━━━━━━━━━━━━━`;

    // --- SEND MESSAGE ---
    await conn.sendMessage(
      from,
      {
        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
        caption: menu,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: config.NEWSLETTER_JID || '120363289379419860@newsletter',
            newsletterName: "『 𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐕𝟐 』",
            serverMessageId: 143
          }
        }
      },
      { quoted: quotedContact }
    );

    // Optional Audio Trigger
    if (config.MENU_AUDIO_URL) {
      await conn.sendMessage(from, { 
        audio: { url: config.MENU_AUDIO_URL }, 
        mimetype: 'audio/mp4', 
        ptt: true 
      }, { quoted: mek });
    }

  } catch (e) {
    console.error('Menu Error:', e);
    await reply(`❌ Error loading menu: ${e.message}`);
  }
});
