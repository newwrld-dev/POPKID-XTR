const { cmd } = require('../command');
const { getAnti, setAnti } = require('../data/antidel');

cmd({
    pattern: "antidelete",
    alias: ['antidel', 'del'],
    desc: "Toggle anti-delete feature",
    category: "misc",
    filename: __filename
},
async (conn, mek, m, { from, reply, text, isCreator, sender }) => {
    if (!isCreator) return reply('❌ This command is only for the bot owner');

    // Newsletter configuration
    const newsletterConfig = {
        contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363289379419860@newsletter',
                newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄',
                serverMessageId: 143
            }
        }
    };

    try {
        const currentStatus = await getAnti();

        // Closure box for status
        const createBox = (title, content) => `
╭╴╴╴╴╴╴╴╴╴╴╴╴╴╴╮
│ ${title} ⚙️✨
╰╴╴╴╴╴╴╴╴╴╴╴╴╴╴╯
${content}
┃└─────────────┈⊷
`;

        if (!text || text.toLowerCase() === 'status') {
            const box = createBox('🔒 AntiDelete Status', `
Current Status: ${currentStatus ? '✅ ON' : '❌ OFF'}

*Usage:*
• .antidelete on - Enable protection
• .antidelete off - Disable protection
• .antidelete status - Check current status

⚡ 𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝 𝐛𝐨𝐭
            `);
            return await conn.sendMessage(from, { text: box, ...newsletterConfig }, { quoted: mek });
        }

        const action = text.toLowerCase().trim();

        if (action === 'on') {
            await setAnti(true);
            const box = createBox('✅ Anti-delete Enabled', `
Message deletion protection is now active!
            `);
            return await conn.sendMessage(from, { text: box, ...newsletterConfig }, { quoted: mek });
        } 
        else if (action === 'off') {
            await setAnti(false);
            const box = createBox('❌ Anti-delete Disabled', `
Message deletion protection has been turned off.
            `);
            return await conn.sendMessage(from, { text: box, ...newsletterConfig }, { quoted: mek });
        } 
        else {
            const box = createBox('⚠️ Invalid Command', `
*Usage:*
• .antidelete on - Enable protection
• .antidelete off - Disable protection
• .antidelete status - Check current status
            `);
            return await conn.sendMessage(from, { text: box, ...newsletterConfig }, { quoted: mek });
        }
    } catch (e) {
        console.error("Error in antidelete command:", e);
        const box = `
╭╴╴╴╴╴╴╴╴╴╴╴╴╴╴╮
│ ❌ Error Occurred ⚡
╰╴╴╴╴╴╴╴╴╴╴╴╴╴╴╯
Failed to process your request. Please try again later.
┃└─────────────┈⊷
`;
        return await conn.sendMessage(from, { text: box, ...newsletterConfig }, { quoted: mek });
    }
});
