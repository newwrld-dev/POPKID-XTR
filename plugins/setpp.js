const fs = require('fs');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "setpp",
    desc: "Change bot profile picture",
    category: "owner",
    react: "❤️",
    filename: __filename
},
async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        // Owner check
        if (!isOwner) return reply("❌ Owner only command");

        // Check if there is a quoted message
        const quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        if (!quoted) return reply("❌ Please reply to an image.");

        // Check if the quoted message is an image
        const mime = quoted.imageMessage ? 'image/jpeg' : null;
        if (!mime) return reply("❌ Please reply to an **image** only.");

        // React with loading
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Download the media from the quoted message
        const buffer = await m.quoted.download();

        // Update the Profile Picture
        // Use conn.user.id or conn.decodeJid(conn.user.id)
        await conn.updateProfilePicture(conn.user.id, buffer);

        // Success notification
        await conn.sendMessage(from, {
            text: "✅ *Profile picture updated successfully!*"
        }, { quoted: mek });

    } catch (err) {
        console.error("Error updating DP:", err);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ Error: " + err.message);
    }
});
