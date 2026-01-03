const { cmd } = require("../command");

cmd({
  pattern: "send",
  alias: ["sendme", "save"],
  react: "📤",
  desc: "Forwards quoted message back to your DM or current chat",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from, sender }) => {
  try {
    // 1. Check if a message is quoted
    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a message (image, video, audio, or doc)!*"
      }, { quoted: message });
    }

    // 2. Download the media
    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const caption = match.quoted.text || "";
    
    // Determine where to send: 'sender' sends to user's DM, 'from' sends to current chat
    const target = sender; 

    let messageContent = {};

    // 3. Handle different message types
    switch (mtype) {
      case "imageMessage":
        messageContent = { image: buffer, caption };
        break;
      case "videoMessage":
        messageContent = { video: buffer, caption };
        break;
      case "audioMessage":
        messageContent = { 
            audio: buffer, 
            mimetype: match.quoted.mimetype || "audio/mp4", 
            ptt: match.quoted.ptt || false 
        };
        break;
      case "stickerMessage":
        messageContent = { sticker: buffer };
        break;
      case "documentMessage":
        messageContent = { 
            document: buffer, 
            mimetype: match.quoted.mimetype, 
            fileName: match.quoted.fileName || 'file' 
        };
        break;
      case "conversation":
      case "extendedTextMessage":
        messageContent = { text: match.quoted.text };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ This message type is not supported yet."
        }, { quoted: message });
    }

    // 4. Send the message
    await client.sendMessage(target, messageContent);
    
    // 5. Optional: Confirm to the group that it was sent to DM
    if (target === sender && from !== sender) {
        await client.sendMessage(from, { text: "_Sent to your Inbox! ✅_" }, { quoted: message });
    }

  } catch (error) {
    console.error("Forward Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error forwarding message:\n" + error.message
    }, { quoted: message });
  }
});
