const fs = require('fs');
const path = require('path');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

// Import SQLite config database
const { getConfig } = require('./lib/configdb');

// Helper
function getSetting(key, fallback) {
    const dbValue = getConfig(key);
    if (dbValue !== null && dbValue !== undefined) return dbValue;
    if (process.env[key] !== undefined) return process.env[key];
    return fallback;
}

// Convert string bools to actual booleans when needed
function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: getSetting("SESSION_ID", "popkid-session"),

    AUTO_STATUS_SEEN: getSetting("AUTO_STATUS_SEEN", "true"),
    AUTO_STATUS_REPLY: getSetting("AUTO_STATUS_REPLY", "false"),
    AUTO_BIO: getSetting("AUTO_BIO", "true"),
    AUTO_STATUS_REACT: getSetting("AUTO_STATUS_REACT", "true"),
    AUTO_STATUS_MSG: getSetting("AUTO_STATUS_MSG", ".𝗦𝗘𝗘𝗡 𝗬𝗢𝗨𝗥 𝗦𝗧𝗔𝗧𝗨𝗦 𝗕𝗬 𝗣𝗢𝗣𝗞𝗜𝗗 𝗫𝗧𝗥🔄"),

    ANTI_LINK: getSetting("ANTI_LINK", "true"),
    MENTION_REPLY: getSetting("MENTION_REPLY", "true"),
    MENU_IMAGE_URL: getSetting("MENU_IMAGE_URL", "https://files.catbox.moe/kiy0hl.jpg"),

    PREFIX: getSetting("PREFIX", "."),
    BOT_NAME: getSetting("BOT_NAME", "POPKID-MD"),
    STICKER_NAME: getSetting("STICKER_NAME", "POPKID-MD"),

    CUSTOM_REACT: getSetting("CUSTOM_REACT", "true"),
    CUSTOM_REACT_EMOJIS: getSetting("CUSTOM_REACT_EMOJIS", "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍"),

    DELETE_LINKS: getSetting("DELETE_LINKS", "false"),

    OWNER_NUMBER: getSetting("OWNER_NUMBER", "254732297194"),
    OWNER_NAME: getSetting("OWNER_NAME", "POPKID"),
    DESCRIPTION: getSetting("DESCRIPTION", "*© popkid xtr bot*"),

    ALIVE_IMG: getSetting("ALIVE_IMG", "https://files.catbox.moe/n8o8py.jpg"),
    LIVE_MSG: getSetting("LIVE_MSG", ">POPKID MD IS ALIVE😍"),

    READ_MESSAGE: getSetting("READ_MESSAGE", "false"),
    AUTO_REACT: getSetting("AUTO_REACT", "true"),
    ANTI_BAD: getSetting("ANTI_BAD", "true"),

    MODE: getSetting("MODE", "public"),
    ANTI_LINK_KICK: getSetting("ANTI_LINK_KICK", "false"),

    AUTO_VOICE: getSetting("AUTO_VOICE", "true"),
    AUTO_STICKER: getSetting("AUTO_STICKER", "false"),
    AUTO_REPLY: getSetting("AUTO_REPLY", "true"),

    ALWAYS_ONLINE: getSetting("ALWAYS_ONLINE", "false"),
    PUBLIC_MODE: getSetting("PUBLIC_MODE", "true"),
    AUTO_TYPING: getSetting("AUTO_TYPING", "true"),
    READ_CMD: getSetting("READ_CMD", "false"),

    DEV: getSetting("DEV", "254732297194"),

    ANTI_VV: getSetting("ANTI_VV", "true"),
    ANTI_DEL_PATH: getSetting("ANTI_DEL_PATH", "log"),
    AUTO_RECORDING: getSetting("AUTO_RECORDING", "true"),
};
