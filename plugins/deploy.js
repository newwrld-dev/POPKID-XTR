const config = require('../config');
const { cmd, commands } = require('../command');
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
    // Only allow the creator (Popkid) to deploy
    if (!isOwner) return reply("❌ *This command is restricted to my Developer (Popkid).*");

    if (!text) {
        return reply(`❌ *Usage:* ${config.PREFIX}deploy <SESSION_ID>\n\n*Example:* \`${config.PREFIX}deploy POPKID;;;abc#def123\``);
    }

    try {
        let sessionId = text.trim();

        // Strip the POPKID;;; prefix if it's there
        if (sessionId.startsWith('POPKID;;;')) {
            sessionId = sessionId.split('POPKID;;;')[1];
        }

        // Basic Mega link check
        if (!sessionId.includes('#')) {
            return reply("❌ *Invalid format!* Session ID must contain the Mega key (e.g., abc#def123)");
        }

        // Notify user processing has started
        const msg = await conn.sendMessage(from, { text: '✞︎ *𝐃𝐄𝐏𝐋𝐎𝐘𝐈𝐍𝐆 𝐒𝐄𝐒𝐒𝐈𝐎𝐍...*' }, { quoted: mek });

        const sessionName = `popkid-instance-${Date.now()}`;
        const sessionPath = path.resolve(__dirname, '../sessions'); 
        
        // Ensure directory exists
        if (!require('fs').existsSync(sessionPath)) {
            await fs.mkdir(sessionPath, { recursive: true });
        }

        const [fileId, key] = sessionId.split('#');
        const file = File.fromURL(`https://mega.nz/file/${fileId}#${key}`);

        // Download session buffer
        const buffer = await new Promise((res, rej) => {
            file.download((e, d) => e ? rej(e) : res(d));
        });

        // Write to creds.json
        await fs.writeFile(path.join(sessionPath, 'creds.json'), buffer);

        // Path to your main file
        const startFilePath = path.resolve(process.cwd(), 'index.js');

        // Launch the process fork
        const child = fork(startFilePath, [], {
            env: {
                ...process.env,
                SESSION_ID: `POPKID;;;${sessionId}`,
                PREFIX: config.PREFIX || '.',
                MODE: 'public'
            }
        });

        // Stylish Success Message (Matching your Ping style)
        let status = `╔═══════════════╗
   ✰  *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐃𝐄𝐏𝐋𝐎𝐘* ✰
╚═══════════════╝
┌─────────────────┐
│ ✞︎ **sᴇssɪᴏɴ:** sᴜᴄᴄᴇss ✅
│ ✞︎ **ɪɴsᴛᴀɴᴄᴇ:** ${sessionName}
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

        // Delete the "Deploying..." message
        await conn.sendMessage(from, { delete: msg.key });

    } catch (e) {
        console.log(e);
        reply(`❌ *Deployment Error:* ${e.message}`);
    }
});
