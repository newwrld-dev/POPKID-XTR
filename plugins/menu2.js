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
    const greeting = moment.tz('Africa/Nairobi').hour() < 12 ? "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ" : moment.tz('Africa/Nairobi').hour() < 17 ? "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ" : "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ";

    let menuText = `👋 Hello @${sender.split("@")[0]}, ${greeting}

Welcome to *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}*. Use the buttons below to navigate the menu or view the command list.

*🕒 Time:* ${time}
*🚀 Ping:* ${Date.now() - m.messageTimestamp * 1000}ms`;

    // Define your buttons
    const buttons = [
      {
        buttonId: `${prefix}ping`,
        buttonText: { displayText: '🚀 SPEED/PING' },
        type: 1
      },
      {
        buttonId: `${prefix}list`,
        buttonText: { displayText: '📜 COMMAND LIST' },
        type: 1
      },
      {
        buttonId: `${prefix}owner`,
        buttonText: { displayText: '👤 OWNER INFO' },
        type: 1
      }
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
                renderLargerThumbnail: true
            }
        }
    };

    return await conn.sendMessage(from, buttonMessage, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
