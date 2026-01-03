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

Welcome to *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}*. 

*🕒 Time:* ${time}
*🚀 Ping:* ${Date.now() - m.messageTimestamp * 1000}ms

Please click the button below to view all available command categories.`;

    // Define the sections for the List
    const sections = [
        {
            title: "MAIN MENU",
            rows: [
                { title: "All Commands", rowId: `${prefix}allmenu`, description: "View every command available" },
                { title: "Bot Status", rowId: `${prefix}ping`, description: "Check speed and uptime" }
            ]
        },
        {
            title: "SUPPORT",
            rows: [
                { title: "Owner Info", rowId: `${prefix}owner`, description: "Contact the developer" },
                { title: "Script Info", rowId: `${prefix}sc`, description: "Get bot source code" }
            ]
        }
    ];

    const listMessage = {
        text: menuText,
        footer: 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ',
        title: "ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ2",
        buttonText: "ᴄʟɪᴄᴋ ʜᴇʀᴇ ꜰᴏʀ ᴍᴇɴᴜ ☰",
        sections
    };

    return await conn.sendMessage(from, listMessage, { quoted: mek });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
