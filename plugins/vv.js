// 🌟 coded by WHITESHADOW x Umar
const { cmd } = require("../command");

cmd({
  pattern: "vv",
  alias: ["viewonce", "view", "open"],
  react: "🔪",
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isCreator, sender }) => {
  try {
    // React on command usage
    await client.sendMessage(from, { react: { text: "🥺", key: message.key } });

    // Owner check
    if (!isCreator) {
      await client.sendMessage(from, { react: { text: "😎", key: message.key } });
      return await client.sendMessage(from, {
        text: "*🚫 This command is restricted to the bot owner only.*"
      }, { quoted: message });
    }

    // Check if a message was quoted
    if (!match.quoted) {
      await client.sendMessage(from, { react: { text: "☺️", key: message.key } });
      return await client.sendMessage(from, {
        text: "*⚠️ Please reply to a private photo, video, or audio message.*\n\n*Then use this command:* `vv`\n\n*Watch the magic happen!* 😎"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const options = { 
      quoted: message,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: "popkid xtr",
          serverMessageId: 143
        }
      }
    };
    let messageContent = {};

    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: match.quoted.text || "",
          mimetype: match.quoted.mimetype || "image/jpeg"
        };
        break;

      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: match.quoted.text || "",
          mimetype: match.quoted.mimetype || "video/mp4"
        };
        break;

      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: match.quoted.ptt || false
        };
        break;

      default:
        await client.sendMessage(from, { react: { text: "😥", key: message.key } });
        return await client.sendMessage(from, {
          text: "*⚠️ Please reply to a view-once photo, private video, audio, or file to use this command.*"
        }, { quoted: message });
    }

    // Send the retrieved media with modern forwarding style
    await client.sendMessage(from, messageContent, options);

    // React on success
    await client.sendMessage(from, { react: { text: "😃", key: message.key } });

  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, { react: { text: "😔", key: message.key } });
    await client.sendMessage(from, {
      text: "❌ ERROR:\n" + error.message
    }, { quoted: message });
  }
});
