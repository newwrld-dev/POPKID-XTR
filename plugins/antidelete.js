import fs from 'fs';
import path from 'path';
import config from '../config.cjs';

// --- DATABASE SETUP ---
const dirPath = './data';
const filePath = path.join(dirPath, 'antidelete.json');

if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));

const antideletePlugin = async (Matrix, m) => {
    const prefix = config.PREFIX;
    const body = m.body || "";
    const args = body.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    /* 1. THE COMMAND PART (.ad on/off) */
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
            return m.reply(`*ᴘᴏᴘᴋɪᴅ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ*\n\nUsage:\n${prefix}ad on chat\n${prefix}ad on pc\n${prefix}ad off`);
        }
    }

    /* 2. THE STORAGE PART (Saves every message to JSON) */
    // We save messages as they arrive so we can recover them later
    if (m.key && !m.key.fromMe && m.message && !m.message.protocolMessage) {
        try {
            const db = JSON.parse(fs.readFileSync(filePath));
            db[m.key.id] = {
                chat: m.from,
                sender: m.sender,
                message: m.message, // Saves the raw message object
                pushName: m.pushName,
                timestamp: Date.now()
            };

            // Keep database small: Delete logs older than 24 hours
            const now = Date.now();
            Object.keys(db).forEach(id => {
                if (now - db[id].timestamp > 86400000) delete db[id];
            });

            fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
        } catch (e) {
            console.error("AD Save Error:", e);
        }
    }

    /* 3. THE RECOVERY PART (Detects Deletion) */
    if (config.ANTIDELETE === true || config.ANTIDELETE === 'true') {
        if (m.type === 'protocolMessage' && m.message.protocolMessage?.type === 2) {
            const deleteKey = m.message.protocolMessage.key;

            try {
                const db = JSON.parse(fs.readFileSync(filePath));
                const oldMsg = db[deleteKey.id];

                if (oldMsg) {
                    const destination = config.ANTIDELETE_TARGET === "pc" ? Matrix.user.id : m.from;
                    const header = `🚫 *ᴘᴏᴘᴋɪᴅ ᴀɴᴛɪ-ᴅᴇʟᴇᴛᴇ*\n👤 *sᴇɴᴅᴇʀ:* @${oldMsg.sender.split('@')[0]}`;

                    // Send the notification
                    await Matrix.sendMessage(destination, { 
                        text: header, 
                        mentions: [oldMsg.sender] 
                    }, { quoted: m });

                    // Reconstruct and send the deleted message
                    await Matrix.sendMessage(destination, { forward: { key: deleteKey, message: oldMsg.message } }, { quoted: m });
                    
                    // Optional: Clean up that specific entry from JSON after recovery
                    delete db[deleteKey.id];
                    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
                }
            } catch (err) {
                console.error("AD Recovery Error:", err);
            }
        }
    }
};

export default antideletePlugin;
