import config from '../config.cjs';

const setpp = async (m, Matrix) => {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

    // Command patterns
    if (!['setpp', 'setppbot', 'setdp'].includes(cmd)) return;

    try {
        // Owner Check (Using pushName or Jid as per your config style)
        const botNumber = await Matrix.decodeJid(Matrix.user.id);
        if (m.sender !== botNumber && !config.OWNER_NAME.includes(m.pushName)) {
            return m.reply("❌ *Owner only command!*");
        }

        // Identify the image (from reply or direct message)
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime.startsWith('image')) {
            return m.reply("❌ *Please reply to an image.*");
        }

        // React to indicate processing
        await m.React("⏳");

        // Download media buffer
        const buffer = await quoted.download();

        // Update Profile Picture
        // We use Matrix.user.id for the bot's own profile
        await Matrix.updateProfilePicture(botNumber, buffer);

        // Success React and Message
        await m.React("✅");
        await Matrix.sendMessage(m.from, { 
            text: "✅ *Bot profile picture updated successfully!*" 
        }, { quoted: m });

    } catch (err) {
        console.error("Error updating DP:", err);
        await m.React("❌");
        m.reply("❌ *Failed to update DP:* " + err.message);
    }
};

export default setpp;
