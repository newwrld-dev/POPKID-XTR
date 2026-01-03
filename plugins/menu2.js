const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

cmd({
  pattern: 'menu2',
  alias: ['allmenu2', 'help2'],
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
    
    const mode = config.MODE === 'public' ? 'ᴘᴜʙʟɪᴄ' : 'ᴘʀɪᴠᴀᴛᴇ';
    
    let menuText = `┏━━〔 *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* 〕━━┈⊷
┃⚡ *ᴜsᴇʀ*: @${sender.split("@")[0]}
┃⚡ *sᴛᴀᴛᴜs*: ${greeting}
┃⚡ *ᴍᴏᴅᴇ*: ${mode}
┃📅 *ᴅᴀᴛᴇ*: ${date}
┃🕒 *ᴛɪᴍᴇ*: ${time}
┃⚙️ *ᴄᴍᴅs*: ${commands.length}
┗━━━━━━━━━━━━━━━┈⊷

Welcome to *ᴘᴏᴘᴋɪᴅ-ᴍᴅ*. Select a button below to explore.`;

    // Gifted-MD Button Structure
    const buttons = [
        { buttonId: `${prefix}ping`, buttonText: { displayText: '🚀 SPEED' }, type: 1 },
        { buttonId: `${prefix}list`, buttonText: { displayText: '📜 ALL COMMANDS' }, type: 1 },
        { buttonId: `${prefix}owner`, buttonText: { displayText: '👤 OWNER' }, type: 1 }
    ];

    const buttonMessage = {
        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
        caption: menuText,
        footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ',
        buttons: buttons,
        headerType: 4,
        contextInfo: {
            mentionedJid: [sender],
            externalAdReply: {
                title: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ2",
                body: "ᴀᴅᴠᴀɴᴄᴇᴅ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ",
                mediaType: 1,
                sourceUrl: "https://whatsapp.com/channel/0029Vag99462UPBF93786o1X",
                thumbnailUrl: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg',
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    };

    // Using the Gifted-MD connection to send
    return await conn.sendMessage(from, buttonMessage, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
