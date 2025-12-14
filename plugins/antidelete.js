// ADVANCED ANTIDELETE COMMAND WITH DESTINATION MODES
// Modes: off | chat | private | both | on (alias of private)

const { cmd } = require('../command');
const { getAnti, setAnti } = require('../data/antidel');

cmd({
    pattern: "antidelete",
    alias: ["antidel", "del"],
    desc: "Configure anti-delete feature & destination",
    category: "misc",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, isCreator, sender }) => {

    if (!isCreator) return reply('❌ This command is only for the bot owner');

    const newsletterContext = {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363289379419860@newsletter',
            newsletterName: '𝐏𝐎𝐏𝐊𝐈𝐃 𝐀𝐍𝐓𝐈𝐃𝐄𝐋𝐄𝐓𝐄',
            serverMessageId: 143
        }
    };

    const box = (title, content) => `
╭───────────────╮
│ ${title}
╰───────────────╯
${content}
└───────────────┈⊷`;

    try {
        // Must return: off | chat | private | both
        let currentMode = await getAnti();
        if (!currentMode) currentMode = 'off';

        /* STATUS */
        if (!text || text.toLowerCase() === 'status') {
            return await conn.sendMessage(from, {
                text: box(
                    '🔒 AntiDelete Status ⚙️',
                    `• Current Mode: *${currentMode.toUpperCase()}*

*Available Modes*
• .antidelete off
• .antidelete chat
• .antidelete private
• .antidelete both
• .antidelete on (alias of private)

⚡ 𝐏𝐎𝐏𝐊𝐈𝐃 𝐗𝐌𝐃 𝐁𝐎𝐓`
                ),
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        let mode = text.toLowerCase().trim();

        // "on" behaves like "private"
        if (mode === 'on') mode = 'private';

        const allowed = ['off', 'chat', 'private', 'both'];

        if (!allowed.includes(mode)) {
            return await conn.sendMessage(from, {
                text: box(
                    '⚠️ Invalid Mode',
                    `Valid options:
• off | chat | private | both | on`
                ),
                contextInfo: newsletterContext
            }, { quoted: mek });
        }

        if (mode === currentMode) {
            return reply(`⚠️ AntiDelete is already set to *${mode.toUpperCase()}*`);
        }

        await setAnti(mode);

        return await conn.sendMessage(from, {
            text: box(
                '✅ AntiDelete Updated',
                `• New Mode: *${mode.toUpperCase()}*
✔ Destination configured successfully`
            ),
            contextInfo: newsletterContext
        }, { quoted: mek });

    } catch (err) {
        console.error('ANTIDELETE CMD ERROR:', err);

        return await conn.sendMessage(from, {
            text: box(
                '❌ SYSTEM ERROR',
                'Failed to update AntiDelete settings.\nPlease try again later.'
            ),
            contextInfo: newsletterContext
        }, { quoted: mek });
    }
});
