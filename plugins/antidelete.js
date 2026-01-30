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
  const cmd = body.startsWith(prefix) ? body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
  const args = body.trim().split(/ +/).slice(1);

  /* --- 1. SETTINGS COMMAND (.ad on/off) --- */
  if (cmd === "antidelete" || cmd === "ad") {
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
      return m.reply(`*ᴘᴏᴘᴋɪᴅ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ*\n\n*Usage:*\n${prefix}ad on chat\n${prefix}ad on pc\n${prefix}ad off`);
    }
  }

  /* --- 2. BACKGROUND LOGGING --- */
  // Saves messages as they come in
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
      
      // Auto-clean (removes logs older than 12 hours to stay fast)
      const now = Date.now();
      const keys = Object.keys(db);
      if (keys.length > 500) { // Limit to last 500 messages
         delete db[keys[0]];
      }
      
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
    } catch (e) {
      // Silent error for background logging
    }
  }

  /* --- 3. RECOVERY LOGIC --- */
  if (config.ANTIDELETE === true || config.ANTIDELETE === 'true') {
    if (m.type === 'protocolMessage' && m.message.protocolMessage?.type === 2) {
      const deleteKey = m.message.protocolMessage.key;

      try {
        const db = JSON.parse(fs.readFileSync(filePath));
        const oldMsg = db[deleteKey.id];

        if (oldMsg) {
          const destination = config.ANTIDELETE_TARGET === "pc" ? Matrix.user.id : m.from;
          
          const recoveryHeader = `🚫 *ᴘᴏᴘᴋɪᴅ ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ*\n` +
                                 `👤 *sᴇɴᴅᴇʀ:* @${oldMsg.sender.split('@')[0]}\n` +
                                 `⏰ *ᴛɪᴍᴇ:* ${new Date(oldMsg.timestamp).toLocaleTimeString()}\n\n` +
                                 `_ʀᴇᴄᴏᴠᴇʀɪɴɢ ᴅᴇʟᴇᴛᴇᴅ ᴄᴏɴᴛᴇɴᴛ..._`;

          await Matrix.sendMessage(destination, { 
            text: recoveryHeader, 
            mentions: [oldMsg.sender] 
          }, { quoted: m });

          // Forward the original message back
          await Matrix.sendMessage(destination, { 
            forward: { 
              key: deleteKey, 
              message: oldMsg.message 
            } 
          }, { quoted: m });
        }
      } catch (err) {
        console.error("Recovery error:", err);
      }
    }
  }
};

export default antideleteCmd;
