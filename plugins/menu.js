const config = require('../config');
const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');

// The secret to a perfect Read More: 
// Placing it on its own line after the border avoids those messy dots (...)
const readMore = String.fromCharCode(8206).repeat(4000);

cmd({
    pattern: "menu",
    alias: ["help", "list"],
    desc: "Show the bot menu",
    category: "main",
    react: "💎",
    filename: __filename
}, async (conn, mek, m, { from, prefix, reply }) => {
    try {
        let menuText = `┏━━━〔 *${config.BOT_NAME || 'ᴘᴏᴘᴋɪᴅ-ᴍᴅ'}* 〕━━━┈⊷\n`;
        menuText += `┃ 👤 *ᴜsᴇʀ*: @${m.sender.split('@')[0]}\n`;
        menuText += `┃ 👑 *ᴏᴡɴᴇʀ*: ᴘᴏᴘᴋɪᴅ ᴛᴇᴄʜ\n`;
        menuText += `┃ ⚙️ *ᴄᴍᴅs*: ${commands.length}\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━━┈⊷\n`;
        
        // This line triggers the "Read More" button perfectly
        menuText += `${readMore}\n`;

        // Organize commands by category
        const categories = {};
        commands.forEach(cmd => {
            if (!cmd.dontAdd && cmd.pattern) {
                const cat = cmd.category ? cmd.category.toUpperCase() : "OTHERS";
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd.pattern);
            }
        });

        // Loop through categories and add to menu
        for (const cat in categories) {
            menuText += `\n┏━━〔 *${cat}* 〕━━┈⊷\n`;
            categories[cat].sort().forEach(p => {
                menuText += `┃ ✦ ${prefix}${p}\n`;
            });
            menuText += `┗━━━━━━━━━━━━━━━┈⊷`;
        }

        menuText += `\n\n> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ* © 𝟸𝟶𝟸𝟼🇰🇪`;

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kiy0hl.jpg' },
            caption: menuText,
            mentions: [m.sender]
        }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply("Error: " + e.message);
    }
});
