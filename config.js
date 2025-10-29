const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });
if (fs.existsSync('.env')) require('dotenv').config({ path: './.env' }); // ✅ added for safety

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
SESSION_ID: process.env.SESSION_ID || "session-id-env",
AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*𝗽𝗼𝗽𝗸𝗶𝗱 𝘅𝘁𝗿 𝘃𝗶𝗲𝘄𝗲𝗱 𝘆𝗼𝘂𝗿 𝘀𝘁𝗮𝘁𝘂𝘀😍*",
WELCOME: process.env.WELCOME || "true",
ADMIN_EVENTS: process.env.ADMIN_EVENTS || "false",
ANTI_LINK: process.env.ANTI_LINK || "true",
MENTION_REPLY: process.env.MENTION_REPLY || "false",
MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/kiy0hl.jpg",
PREFIX: process.env.PREFIX || ".",
BOT_NAME: process.env.BOT_NAME || "𝗣𝗢𝗣𝗞𝗜𝗗-𝗫𝗧𝗥",
STICKER_NAME: process.env.STICKER_NAME || "𝗣𝗢𝗣𝗞𝗜𝗗-𝗫𝗧𝗥",
CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
DELETE_LINKS: process.env.DELETE_LINKS || "false",
OWNER_NUMBER: process.env.OWNER_NUMBER || "254732297194",
OWNER_NAME: process.env.OWNER_NAME || "𝗣𝗢𝗣𝗞𝗜𝗗-𝗫𝗧𝗥",
DESCRIPTION: process.env.DESCRIPTION || "*© 𝗽𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗽𝗼𝗽𝗸𝗶𝗱*",
ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/kiy0hl.jpg",
LIVE_MSG: process.env.LIVE_MSG || "> hi! dear I am alive now*⚡",
READ_MESSAGE: process.env.READ_MESSAGE || "false",
AUTO_REACT: process.env.AUTO_REACT || "false",
ANTI_BAD: process.env.ANTI_BAD || "false",
MODE: process.env.MODE || "public",
ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || "false",
AUTO_VOICE: process.env.AUTO_VOICE || "false",
AUTO_STICKER: process.env.AUTO_STICKER || "false",
AUTO_REPLY: process.env.AUTO_REPLY || "false",
ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
AUTO_TYPING: process.env.AUTO_TYPING || "false",
READ_CMD: process.env.READ_CMD || "false",
DEV: process.env.DEV || "923078071982",
ANTI_VV: process.env.ANTI_VV || "true",
ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "log",
AUTO_RECORDING: process.env.AUTO_RECORDING || "false",

// ────────────────────────────────
// 🔧 Added Heroku Restart Support
// ────────────────────────────────
HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || "",
HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",

// ────────────────────────────────
// 🍃 Added MongoDB Support (SAFE)
// ────────────────────────────────
MONGODB_URL: process.env.MONGODB_URL || ""
};
