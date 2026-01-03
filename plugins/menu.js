const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const os = require('os');
const { getPrefix } = require('../lib/prefix');
const { prepareWAMessageMedia, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

const formatSize = (bytes) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + 'GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + 'MB';
    return (bytes / 1024).toFixed(0) + 'KB';
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
    const date = moment.tz('Africa/Nairobi').format('DD/MM/YY');
    const hour = moment.tz('Africa/Nairobi').hour();
    const greeting = hour < 12 ? "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ" : hour < 17 ? "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ" : "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ";
    
    const start = Date.now();
    const ping = Date.now() - start;
    const cpuModel = os.cpus()[0].model.split(' ')[0];

    const commandsByCategory = {};
    commands.forEach(command => {
      if (command.category && !command.dontAdd && command.pattern) {
        const cat = command.category.toUpperCase();
        if (!commandsByCategory[cat]) commandsByCategory[cat] = [];
        commandsByCategory[cat].push(command.pattern.split('|')[0]);
      }
    });

    const categoryKeys = Object.keys(commandsByCategory).sort();
    const cards = [];

    // --- SLIDE 1: MAIN STATUS BOX ---
    const infoHeader = await prepareWAMessageMedia({ image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' } }, { upload: conn.waUploadToServer });
    
    let mainBox = `┏━━〔 *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* 〕━━┈⊷
┃⚡ *ᴜsᴇʀ*: @${sender.split("@")[0]}
┃⚡ *sᴛᴀᴛᴜs*: ${greeting}
┃🚀 *ᴘɪɴɢ*: ${ping}ᴍs
┃📅 *ᴅᴀᴛᴇ*: ${date}
┃🕒 *ᴛɪᴍᴇ*: ${time}
┃📟 *ʀᴀᴍ*: ${formatSize(os.totalmem() - os.freemem())}
┃⚙️ *ᴄᴍᴅs*: ${commands.length}
┗━━━━━━━━━━━━━━━┈⊷

↔️ *sᴡɪᴘᴇ ʟᴇғᴛ ᴛᴏ ᴠɪᴇᴡ ᴘᴀɢᴇs*`;

    cards.push({
      header: proto.Message.InteractiveMessage.Header.create({
        ...infoHeader,
        title: `*ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴠ2*`,
        hasMediaAttachment: true,
      }),
      body: { text: mainBox },
      nativeFlowMessage: { buttons: [] }
    });

    // --- SLIDE 2 & BEYOND: CATEGORY BOXES ---
    for (const category of categoryKeys) {
      const sortedCmds = commandsByCategory[category].sort();
      let cmdList = sortedCmds.map(cmdName => `┃ ✦ ${prefix}${cmdName}`).join('\n');
      
      let catBox = `┏━━〔 *${category}* 〕━━┈⊷\n${cmdList}\n┗━━━━━━━━━━━━━━━┈⊷`;
      
      const media = await prepareWAMessageMedia({ image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' } }, { upload: conn.waUploadToServer });

      cards.push({
        header: proto.Message.InteractiveMessage.Header.create({
          ...media,
          title: `*${category}*`,
          hasMediaAttachment: true,
        }),
        body: { text: catBox },
        footer: { text: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ" },
        nativeFlowMessage: { buttons: [] }
      });
    }

    const carouselMsg = generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: "*ᴘᴏᴘᴋɪᴅ-ᴍᴅ ꜱʟɪᴅᴇ ᴍᴇɴᴜ*" },
            carouselMessage: {
              cards,
              messageVersion: 1
            }
          }
        }
      }
    }, { quoted: mek });

    return await conn.relayMessage(from, carouselMsg.message, { messageId: carouselMsg.key.id });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}\nEnsure your MENU_IMAGE_URL is correct.`);
  }
});
