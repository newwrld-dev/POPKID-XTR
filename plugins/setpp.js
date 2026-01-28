import config from '../../config.cjs';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const setpp = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "setpp") {
    try {
      // 1. Check if the user is replying to an image or if the message itself is an image
      const quoted = m.quoted ? m.quoted : m;
      const mime = (quoted.msg || quoted).mimetype || '';

      if (!/image/.test(mime)) {
        return m.reply("❌ Please reply to an image to set it as the profile picture.");
      }

      await m.React('⏳');

      // 2. Download the media
      const stream = await downloadContentFromMessage(
        quoted.msg || quoted,
        'image'
      );
      
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 3. Update the Profile Picture
      // Use sock.user.id to update your own bot's PP, or m.from for a group (if bot is admin)
      await sock.updateProfilePicture(sock.user.id, buffer);

      await m.React('✅');
      await sock.sendMessage(m.from, { text: "Successfully updated profile picture! 🖼️" }, { quoted: m });

    } catch (error) {
      console.error(error);
      await m.React('❌');
      await sock.sendMessage(m.from, { text: "Failed to update profile picture. Ensure I have the correct permissions." }, { quoted: m });
    }
  }
};

export default setpp;
