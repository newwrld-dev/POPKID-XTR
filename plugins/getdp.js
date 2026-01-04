const { cmd } = require('../command');

cmd({
    pattern: "getdp",
    desc: "Get profile picture of a user or group",
    category: "tools",
    react: "📸",
    filename: __filename
},
async (conn, mek, m, { from, quoted, isGroup, reply }) => {
    try {
        // 1. Determine whose DP to get
        let target;
        if (m.mentionedJid && m.mentionedJid[0]) {
            // If someone is tagged
            target = m.mentionedJid[0];
        } else if (m.msg.contextInfo && m.msg.contextInfo.participant) {
            // If replying to a message
            target = m.msg.contextInfo.participant;
        } else {
            // Default to the current chat (User or Group)
            target = from;
        }

        // 2. Fetch the Profile Picture URL
        // 'image' type gets the high-resolution version
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(target, 'image');
        } catch (e) {
            // Fallback if they don't have a DP or it's hidden by privacy
            return reply("❌ I couldn't fetch the profile picture. It might be private or not set.");
        }

        // 3. Send the image
        await conn.sendMessage(from, { 
            image: { url: ppUrl }, 
            caption: `📸 *Profile Picture of:* @${target.split('@')[0]}`,
            mentions: [target]
        }, { quoted: mek });

    } catch (err) {
        console.error(err);
        reply("❌ Error fetching profile picture.");
    }
});
