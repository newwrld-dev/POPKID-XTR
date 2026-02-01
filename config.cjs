const fs = require("fs");
// REMOVED: require("dotenv").config() as it's handled by index.js 
// this prevents the 'dotenv package not found' crash during sub-loading

const config = {
  SESSION_ID: process.env.SESSION_ID || "",
  PREFIX: process.env.PREFIX || '.',
  BOT_NAME: process.env.BOT_NAME || "POPKID-XMD",
  BOT: process.env.BOT || "hello 👋",
  NEW_CMD: process.env.NEW_CMD || "ᴀᴅᴅᴠᴀʀ\n│ sᴜᴅᴏ\n| popkid",
  CAPTION: process.env.CAPTION || "ᴘᴏᴡᴇʀᴇᴅ ʙʏ popkid",
  
  // Boolean conversions - optimized for Node v24
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN === 'true' || true, // Defaulting to true as per your code
  AUTO_BIO: process.env.AUTO_BIO === 'true' || true,
  AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT === 'true' || true,
  ANTI_LEFT: process.env.ANTI_LEFT === 'true' || true,
  AUTOLIKE_EMOJI: process.env.AUTOLIKE_EMOJI || '💙',
  AUTO_REPLY_STATUS: process.env.AUTO_REPLY_STATUS === 'true' || false,
  STATUS_READ_MSG: process.env.STATUS_READ_MSG || 'Status Viewed by popkid',
  VOICE_CHAT_BOT: process.env.VOICE_CHAT_BOT === 'true' || false,
  ANTILINK: process.env.ANTILINK === 'true' || false,
  AUTO_STICKER: process.env.AUTO_STICKER === 'true' || false,
  AUTO_READ: process.env.AUTO_READ === 'true' || false,
  AUTO_TYPING: process.env.AUTO_TYPING === 'true' || false,
  AUTO_RECORDING: process.env.AUTO_RECORDING === 'true' || false,
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE === 'true' || false,
  AUTO_REACT: process.env.AUTO_REACT === 'true' || false,
  AUTO_BLOCK: process.env.AUTO_BLOCK === 'true' || true,
  ANTI_DELETE: process.env.ANTI_DELETE === 'true' || false,
  CHAT_BOT: process.env.CHAT_BOT === 'true' || false,
  AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "hello",
  LYDEA: process.env.LYDEA === 'true' || false,
  REJECT_CALL: process.env.REJECT_CALL === 'true' || false,
  NOT_ALLOW: process.env.NOT_ALLOW === 'true' || true,
  MODE: process.env.MODE || "public",
  DELETED_MESSAGES_CHAT_ID: process.env.DELETED_MESSAGES_CHAT_ID || "254732297194@s.whatsapp.net",
  OWNER_NAME: process.env.OWNER_NAME || "popkid",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "254732297194",
  SUDO_NUMBER: process.env.SUDO_NUMBER || "254732297194",
  GEMINI_KEY: process.env.GEMINI_KEY || "AIzaSyCUPaxfIdZawsKZKqCqJcC-GWiQPCXKTDc",
  WELCOME: process.env.WELCOME === 'true' || false,

  // Antibot
  ANTIBOT: process.env.ANTIBOT === 'true' || false,
  ANTIBOT_WARNINGS: parseInt(process.env.ANTIBOT_WARNINGS) || 3
};

module.exports = config;
