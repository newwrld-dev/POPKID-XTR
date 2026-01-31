import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../config.cjs';

// Database setup
const dirPath = './data';
const filePath = path.join(dirPath, 'antidelete.json');
if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));

const antideleteCmd = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix) 
    ? body.slice(prefix.length).split(" ")[0].toLowerCase() 
    : "";
  const args = body.trim().split(/ +/).slice(1);

  // --- 1. SETTINGS COMMAND LOGIC ---
  if (cmd === "ad" || cmd === "antidelete") {
    if (!m.isGroup && !m.key.fromMe) return;

    const action = args[0]?.toLowerCase();
    const target = args[1]?.toLowerCase();

    if (action === "on") {
      config.ANTIDELETE = true;
      config.ANTIDELETE_TARGET = target === "pc" ? "pc" : "chat";
      return m.reply(`✅ *ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴀᴄᴛɪᴠᴀᴛᴇᴅ*\n📍 *ʟᴏᴄᴀᴛɪᴏɴ:* ${config.ANTIDELETE_TARGET === "pc" ? "Private Chat" : "Same Chat"}`);
    } else if (action === "off") {
      config.ANTIDELETE = false;
      return m.reply(`❌ *ᴀɴᴛɪᴅᴇʟᴇᴛᴇ ᴅᴇᴀᴄᴛɪᴠᴀᴛᴇᴅ*`);
    } else {
      return m.reply(`*ᴘᴏᴘᴋɪᴅ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ*\n\nUsage:\n${prefix}ad on chat\n${prefix}ad on pc\n${prefix}ad off`);
    }
  }

  // --- 2. BACKGROUND MESSAGE LOGGING ---
  // This saves messages so they can be recovered later
  if (m.key && !m.key.fromMe && m.message && !m.message.protocolMessage) {
    try {
      const db = JSON.parse(fs.readFileSync(filePath));
      db[m.key.id] = {
        chat: m.from,
        sender: m.sender,
        message: m.message,
        pushName: m.pushName,
        timestamp: Date.now()
      };
      
      // Keep database lean (last 500 messages)
      const keys = Object.keys(db);
      if (keys.length > 500) delete db[keys[0]];
      
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
    } catch (e) { /* silent log */ }
  }

  // --- 3. RECOVERY LOGIC (THE POPKID STYLE) ---
  if (config.ANTIDELETE === true || config.ANTIDELETE === 'true') {
    if (m.type === 'protocolMessage' && m.message.protocolMessage?.type === 2) {
      const deleteKey = m.message.protocolMessage.key;

      try {
        const db = JSON.parse(fs.readFileSync(filePath));
        const oldMsg = db[deleteKey.id];

        if (oldMsg) {
          const destination = config.ANTIDELETE_TARGET === "pc" ? Matrix.user.id : m.from;

          // Fetch Menu Image exactly like ping.js
          const getMenuImage = async () => {
            if (config.MENU_IMAGE && config.MENU_IMAGE.trim() !== '') {
              try {
                const response = await axios.get(config.MENU_IMAGE, { responseType: 'arraybuffer' });
                return Buffer.from(response.data, 'binary');
              } catch { return fs.readFileSync('./media/zenor.jpeg'); }
            } else { return fs.readFileSync('./media/zenor.jpeg'); }
          };

          const menuImage = await getMenuImage();
          const recoveryText = `🚫 *ᴘᴏᴘᴋɪᴅ ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ*\n\n` +
                               `👤 *sᴇɴᴅᴇʀ:* @${oldMsg.sender.split('@')[0]}\n` +
                               `⏰ *ᴛɪᴍᴇ:* ${new Date(oldMsg.timestamp).toLocaleTimeString()}\n\n` +
                               `_ᴘᴏᴘᴋɪᴅ ʜᴀs ʀᴇᴄᴏᴠᴇʀᴇᴅ ᴀ ᴅᴇʟᴇᴛᴇᴅ ᴍᴇssᴀɢᴇ_`;

          // Send Alert with your stylish ContextInfo
          await Matrix.sendMessage(destination, {
            image: menuImage,
            caption: recoveryText,
            contextInfo: {
              mentionedJid: [oldMsg.sender],
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363289379419860@newsletter',
                newsletterName: "ᴘᴏᴘᴋɪᴅ ᴜᴘᴅᴀᴛᴇs",
                serverMessageId: 143
              },
              externalAdReply: {
                title: "ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ sʏsᴛᴇᴍ",
                body: "ᴍᴇssᴀɢᴇ ʀᴇᴄᴏᴠᴇʀʏ ᴀᴄᴛɪᴠᴇ",
                thumbnailUrl: "https://files.catbox.moe/yr339d.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
                mediaType: 1,
                renderLargerThumbnail: false
              }
            }
          }, { quoted: m });

          // Forward the actual deleted content
          await Matrix.sendMessage(destination, { 
            forward: { key: deleteKey, message: oldMsg.message } 
          }, { quoted: m });
        }
      } catch (err) {
        console.error("RECOVERY ERROR:", err);
      }
    }
  }
};

export default antideleteCmd;
