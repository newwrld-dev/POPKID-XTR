import config from '../../config.cjs';

const setpp = async (m, sock) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix)
      ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
      : '';

    if (cmd !== 'setpp') return;

    // OWNER CHECK
    const ownerNumber = config.OWNER_NUMBER; // e.g ["2547xxxxxxx"]
    const senderNumber = m.sender.split('@')[0];
    const isOwner = ownerNumber.includes(senderNumber);

    if (!isOwner) {
      return sock.sendMessage(m.from, { text: "❌ Owner only command." }, { quoted: m });
    }

    // CHECK QUOTED MESSAGE
    if (!m.quoted) {
      return sock.sendMessage(
        m.from,
        { text: "❌ Please reply to an *image*." },
        { quoted: m }
      );
    }

    // CHECK IMAGE TYPE
    const mime = m.quoted.mimetype || '';
    if (!mime.startsWith('image/')) {
      return sock.sendMessage(
        m.from,
        { text: "❌ Only images are supported." },
        { quoted: m }
      );
    }

    // REACT LOADING
    await sock.sendMessage(m.from, {
      react: { text: "⏳", key: m.key }
    });

    // DOWNLOAD IMAGE
    const buffer = await m.quoted.download();

    // UPDATE PROFILE PICTURE
    const botJid = sock.user.id; // bot's JID
    await sock.updateProfilePicture(botJid, buffer);

    // SUCCESS
    await sock.sendMessage(
      m.from,
      {
        text: "✅ *Profile picture updated successfully!*",
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
      { text: "❌ Error while updating profile picture." },
      { quoted: m }
    );
  }
};

export default setpp;
