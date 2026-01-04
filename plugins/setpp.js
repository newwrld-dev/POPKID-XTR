const fs = require('fs');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "setpp",
    desc: "Change bot profile picture",
    category: "owner",
    react: "📸",
    filename: __filename
},
async (conn, mek, m, { from, isQuoted, mime, reply, isOwner }) => {
    try {
        // Owner only
        if (!isOwner) return reply("❌ Owner only command");

        // Must reply to image
        if (!isQuoted || !/image/.test(mime)) {
            return reply("❌ Reply to an image with `.setpp`");
        }

        // Loading reaction
        await conn.sendMessage(from, {
            react: { text: "⏳", key: mek.key }
        });

        // Download image (BUFFER)
        const media = await m.quoted.download();
        const buffer = Buffer.isBuffer(media)
            ? media
            : fs.readFileSync(media);

        // CHANGE PROFILE PICTURE ✅
        await conn.updateProfilePicture(conn.user.id, buffer);

        // Success
        await conn.sendMessage(from, {
            text: "✅ *Profile picture updated successfully*"
        }, { quoted: mek });

    } catch (err) {
        console.error(err);

        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });

        reply("❌ Failed to update profile picture");
    }
});
