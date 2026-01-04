const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "setpp",
    desc: "Set bot profile picture",
    category: "owner",
    react: "🖼️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    try {
        // 1. Check if user is Owner
        if (!isOwner) return reply("❌ Only Popkid can use this command!");

        // 2. Identify the message containing the image
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // Check if it is an image
        if (!mime.includes('image')) {
            return reply("⚠️ Please reply to an image with .setpp");
        }

        reply("⏳ Processing profile picture update...");

        // 3. Download the image buffer directly (faster and avoids file errors)
        const messageType = mime.split('/')[0];
        const stream = await downloadContentFromMessage(
            quoted.msg || quoted,
            messageType
        );
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 4. Update the Profile Picture using the buffer directly
        // This is much faster and doesn't need a 'tmp' folder
        await conn.updateProfilePicture(conn.user.id, buffer);

        return reply("✅ Successfully updated POPKID-MD profile picture!");

    } catch (e) {
        console.error('SetPP Error:', e);
        reply(`❌ Failed to update PP: ${e.message}`);
    }
});
