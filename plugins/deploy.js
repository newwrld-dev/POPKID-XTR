const config = require('../config');
const { cmd } = require('../command');
const fs = require('fs').promises;
const path = require('path');
const { fork } = require('child_process');
const { File } = require('megajs');

cmd({
    pattern: "deploy",
    alias: ["setup", "install"],
    desc: "Deploy a new bot session using Mega session ID",
    category: "owner",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from, text, isOwner, reply, sender }) => {

    if (!isOwner) {
        return reply("❌ *This command is restricted to the bot developer.*");
    }

    if (!text) {
        return reply(
            `❌ *Usage:* ${config.PREFIX}deploy <SESSION_ID>\n\n` +
            `*Example:* ${config.PREFIX}deploy POPKID;;;abc#def123`
        );
    }

    try {
        // ─── CLEAN SESSION ID ───
        let sessionId = text.trim();
        if (sessionId.startsWith('POPKID;;;')) {
            sessionId = sessionId.replace('POPKID;;;', '');
        }

        if (!sessionId.includes('#')) {
            return reply("❌ *Invalid SESSION_ID format!*");
        }

        // ─── STATUS MESSAGE ───
        const waitMsg = await conn.sendMessage(
            from,
            { text: '✞︎ *DEPLOYING SESSION... PLEASE WAIT*' },
            { quoted: mek }
        );

        // ─── PATHS (BULLETPROOF) ───
        const projectRoot = path.dirname(require.main.filename);
        const sessionName = `popkid-${Date.now()}`;
        const sessionDir = path.join(projectRoot, 'sessions', sessionName);

        await fs.mkdir(sessionDir, { recursive: true });

        // ─── DOWNLOAD CREDS FROM MEGA ───
        const [fileId, key] = sessionId.split('#');
        const file = File.fromURL(`https://mega.nz/file/${fileId}#${key}`);

        const buffer = await new Promise((resolve, reject) => {
            file.download((err, data) => err ? reject(err) : resolve(data));
        });

        await fs.writeFile(path.join(sessionDir, 'creds.json'), buffer);

        // ─── START CLIENT ───
        const startClientPath = path.join(projectRoot, 'multi', 'startClient.js');
        await fs.access(startClientPath);

        fork(startClientPath, [], {
            env: {
                ...process.env,
                SESSION_NAME: sessionName,
                PREFIX: config.PREFIX || '.',
                OWNER_NUMBER: sender
            }
        });

        // ─── SUCCESS MESSAGE ───
        const successMsg = `
╔════════════════════╗
║  🚀 *POPKID-MD DEPLOYED*
╠════════════════════╣
║ 📦 Session : ${sessionName}
║ 👑 Owner   : ${sender.split('@')[0]}
║ 🔑 Prefix  : ${config.PREFIX}
╚════════════════════╝
`;

        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/syekq2.jpg' },
            caption: successMsg
        }, { quoted: mek });

        await conn.sendMessage(from, { delete: waitMsg.key });

    } catch (err) {
        console.error('[DEPLOY ERROR]', err);
        reply(`❌ *Deployment failed:* ${err.message}`);
    }
});
