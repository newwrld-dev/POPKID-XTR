const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

cmd({
  pattern: 'menu2',
  alias: ['allmenu2', 'help2'],
  react: '👌',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const time = moment.tz('Africa/Nairobi').format('HH:mm:ss');
    const date = moment.tz('Africa/Nairobi').format('DD/MM/YY');
    const hour = moment.tz('Africa/Nairobi').hour();
    const greeting = hour < 12 ? "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ" : hour < 17 ? "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ" : "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ";
    
    let menuText = `┏━━〔 *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* 〕━━┈⊷
┃⚡ *ᴜsᴇʀ*: @${sender.split("@")[0]}
┃⚡ *sᴛᴀᴛᴜs*: ${greeting}
┃⚡ *ᴍᴏᴅᴇ*: ${config.MODE}
┃📅 *ᴅᴀᴛᴇ*: ${date}
┃🕒 *ᴛɪᴍᴇ*: ${time}
┃⚙️ *ᴄᴍᴅs*: ${commands.length}
┗━━━━━━━━━━━━━━━┈⊷

Welcome to *ᴘᴏᴘᴋɪᴅ-ᴍᴅ*. Select a button below to explore.`;

    // Modern Interactive Button Structure
    const buttons = [
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "🚀 SPEED",
                id: `${prefix}ping`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "📜 ALL COMMANDS",
                id: `${prefix}list`
            })
        },
        {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
                display_text: "👤 OWNER",
                id: `${prefix}owner`
            })
        }
    ];

    const message = {
        interactiveMessage: {
            header: {
                hasMediaAttachment: true,
                imageMessage: (await conn.prepareMessageMedia({ image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' } }, { upload: conn.waUploadToServer })).imageMessage,
            },
            body: { text: menuText },
            footer: { text: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ' },
            nativeFlowMessage: {
                buttons: buttons
            }
        }
    };

    return await conn.sendMessage(from, { viewOnceMessage: { message } }, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
