const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');
const { totalcmds, createSerial } = require("../lib/functions");

// Fonction pour styliser les majuscules comme ʜɪ
function toUpperStylized(str) {
const stylized = {
A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
Y: 'ʏ', Z: 'ᴢ'
};
return str.split('').map(c => stylized[c.toUpperCase()] || c).join('');
}

// Normalisation des catégories
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Emojis par catégorie normalisée
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


// ----------------------------------------------------------
// ✅ YOUR FUNCTION — NOT CHANGED
// ----------------------------------------------------------

async function buildQuotedMeta() {
    const count = await totalcmds();

    let pinterestCache = {};

    const myquoted = {
        key: {
            remoteJid: 'status@broadcast',
            participant: '13135550002@s.whatsapp.net',
            fromMe: false,
            id: createSerial(16).toUpperCase()
        },
        message: {
            contactMessage: {
                displayName: "popkid xtr",
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:POPKID XTR\nORG:POPKID XTR;\nTEL;type=CELL;type=VOICE;waid=13135550002:13135550002\nEND:VCARD`,
                contextInfo: {
                    stanzaId: createSerial(16).toUpperCase(),
                    participant: "0@s.whatsapp.net",
                    quotedMessage: {
                        conversation: " dev popkid"
                    }
                }
            }
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        status: 1,
        verifiedBizName: "Meta"
    };

    return myquoted;
}


// ----------------------------------------------------------
// MENU COMMAND
// ----------------------------------------------------------

cmd({
pattern: 'amenu',
alias: ['allmenu'],
desc: 'Show all bot commands',
category: 'menu',
react: '👌',
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

// 🟢 CALL YOUR QUOTED FUNCTION
const metaQuoted = await buildQuotedMeta();

let menu = `

┏────〘 ᴘᴏᴘᴋɪᴅ xᴛʀ 〙───⊷
┃ ᴜꜱᴇʀ : @${sender.split("@")[0]}
┃ ʀᴜɴᴛɪᴍᴇ : ${uptime()}
┃ ᴍᴏᴅᴇ : ${config.MODE}
┃ ᴘʀᴇғɪx : 「 ${config.PREFIX}」
┃ ᴏᴡɴᴇʀ : ${config.OWNER_NAME}
┃ ᴘʟᴜɢɪɴꜱ : 『 ${commands.length} 』
┃ ᴅᴇᴠ : ᴘᴏᴘᴋɪᴅ
┃ ᴠᴇʀꜱɪᴏɴ : 2.0.0
┗──────────────⊷`;


// GROUP COMMANDS
const categories = {};  
for (const cmd of commands) {  
  if (cmd.category && !cmd.dontAdd && cmd.pattern) {  
    const normalizedCategory = normalize(cmd.category);  
    categories[normalizedCategory] = categories[normalizedCategory] || [];  
    categories[normalizedCategory].push(cmd.pattern.split('|')[0]);  
  }  
}  


// RENDER CATEGORIES
for (const cat of Object.keys(categories).sort()) {  
  const emoji = emojiByCategory[cat] || '🧛‍♂️';  
  menu += `\n\n*┏─『 ${emoji} ${toUpperStylized(cat)} ${toUpperStylized('Menu')} 』──⊷*\n`;  
  for (const cmd of categories[cat].sort()) {  
    menu += `*│ ${prefix}${cmd}*\n`;  
  }  
  menu += `*┗──────────────⊷*`;  
}  

menu += `\n\n> ${config.DESCRIPTION || toUpperStylized('Explore the bot commands!')}`;


// SEND WITH YOUR META QUOTE
await conn.sendMessage(
  from,
  {
    image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
    caption: menu,
    contextInfo: {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true
    }
  },
  { quoted: metaQuoted }
);

} catch (e) {
console.log('Menu Error:', e);
await reply(`❌ ERROR: ${e.message}`);
}
});
