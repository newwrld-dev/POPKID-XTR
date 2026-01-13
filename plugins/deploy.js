const config = require('../config');
const { cmd } = require('../command');
const fs = require('fs').promises;
const path = require('path');
const { fork } = require('child_process');
const { File } = require('megajs');

cmd({
    pattern: "deploy",
    alias: ["setup", "install"],
    desc: "Deploy a new session via Mega link.",
    category: "owner",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from, text, isOwner, reply, sender }) => {

    if (!isOwner) return reply("❌ *This command is restricted to my Developer (Popkid).*");

    if (!text) {
        return reply(`❌ *Usage:* ${config.PREFIX}deploy <SESSION_ID>\n\n*Example:* \`${config.PREFIX}deploy POPKID;;;abc#def123\``);
    }

    try {
        let sessionId = text.trim();

        if (sessionId.startsWith('POPKID;;;')) {
            sessionId = sessionId.split('POPKID;;;')[1];
        }

        if (!sessionId.includes('#')) {
            return reply("❌ *Invalid format!* Session ID must contain the Mega key (abc#def123)");
        }

        const msg = await conn.sendMessage(from, {
            text: '✞︎ *𝐃𝐄𝐏𝐋𝐎𝐘𝐈𝐍𝐆 𝐒𝐄𝐒𝐒𝐈𝐎𝐍...*'
        }, { quoted: mek });

        // ✅ UNIQUE SESSION NAME
        const sessionName = `popkid-${Date.now()}`;

        // ✅ MULTI SESSION PATH
        const sessionPath = path.resolve(__dirname, '../sessions', sessionName);
        await fs.mkdir(sessionPath, { recursive: true });

        const [fileId, key] = sessionId.split('#');
        const file = File.fromURL(`https://mega.nz/file/${fileId}#${key}`);

        const buffer = await new Promise((res, rej) => {
            file.download((e, d) => e ? rej(e) : res(d));
        });

        // ✅ WRITE TO ISOLATED SESSION
        await fs.writeFile(path.join(sessionPath, 'creds.json'), buffer);

        // ✅ START MULTI CLIENT LOADER (NOT index.js)
        const startFilePath = path.resolve(process.cwd(), 'multi/startClient.js');

        await fs.access(startFilePath);

        fork(startFilePath, [], {
            env: {
                ...process.env,
                SESSION_NAME: sessionName,
                PREFIX: config.PREFIX || '.',
                OWNER_NUMBER: sender
            }
        });

        let status = `╔═══════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐃𝐄𝐏𝐋𝐎𝐘* ✰
╚═══════════════╝
┌─────────────────┐
│ ✞︎ **sᴇssɪᴏɴ:** sᴜᴄᴄᴇss ✅
│ ✞︎ **ɴᴀᴍᴇ:** ${sessionName}
│ ✞︎ **ᴏᴡɴᴇʀ:** ${sender.split('@')[0]}
│ ✞︎ **ᴘʀᴇғɪx:** ${config.PREFIX}
└─────────────────┘
━━━━━━━━━━━━━━━━━━━━
✰ *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ* ✰
━━━━━━━━━━━━━━━━━━━━`;

        await conn.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/syekq2.jpg' },
            caption: status
        });

        await conn.sendMessage(from, { delete: msg.key });

    } catch (e) {
        console.log(e);
        reply(`❌ *Deployment Error:* ${e.message}`);
    }
});
