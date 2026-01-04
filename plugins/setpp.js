const { cmd, commands } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const config = require('../config');

cmd({
    pattern: "setpp",
    desc: "Set bot profile picture",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        // 1. Owner Security Check
        if (!isOwner) return reply("❌ This command is only for the Owner, Popkid!");

        // 2. Check if the user replied to an image
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image')) return reply("⚠️ Please reply to an image with .setpp");

        reply("⏳ Updating profile picture...");

        // 3. Define Temporary Path
        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        const mediaPath = path.join(tmpDir, `pp_${Date.now()}.jpg`);

        // 4. Download Media
        const stream = await downloadContentFromMessage(
            quoted.msg || quoted,
            'image'
        );
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 5. Save and Update
        fs.writeFileSync(mediaPath, buffer);

        // Update Bot PP
        await conn.updateProfilePicture(conn.user.id, { url: mediaPath });

        // 6. Cleanup
        fs.unlinkSync(mediaPath);

        return reply("✅ Bot profile picture updated successfully!");

    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
