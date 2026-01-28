import config from '../config.cjs';

const setpp = async (m, sock) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix)
      ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
      : '';

    if (cmd !== 'setpp') return;

    // MUST REPLY TO SOMETHING
    if (!m.quoted || !m.quoted.message) {
      return sock.sendMessage(
        m.from,
        { text: "❌ Reply to an image." },
        { quoted: m }
      );
    }

    // IMAGE DETECTION (FIXED)
    const quotedMsg = m.quoted.message;
    const isImage =
      quotedMsg.imageMessage ||
      quotedMsg.viewOnceMessage?.message?.imageMessage;

    if (!isImage) {
      return sock.sendMessage(
        m.from,
        { text: "❌ Only images are supported." },
        { quoted: m }
      );
    }

    // LOADING REACTION
    await sock.sendMessage(m.from, {
      react: { text: "⏳", key: m.key }
    });

    // DOWNLOAD IMAGE (BAILEYS SAFE)
    const buffer = await m.quoted.download();

    // UPDATE BOT PROFILE PICTURE
    await sock.updateProfilePicture(sock.user.id, buffer);

    // SUCCESS
    await sock.sendMessage(
      m.from,
      {
        text: "✅ *Bot profile picture updated successfully!*",
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363289379419860@newsletter",
            newsletterName: "Popkid-Xmd",
            serverMessageId: -1
          }
        }
      },
      { quoted: m }
    );

  } catch (err) {
    console.error("SETPP ERROR:", err);

    await sock.sendMessage(m.from, {
      react: { text: "❌", key: m.key }
    });

    await sock.sendMessage(
      m.from,
      { text: "❌ Failed to update profile picture." },
      { quoted: m }
    );
  }
};

export default setpp;
