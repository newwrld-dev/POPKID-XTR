import config from '../config.cjs';

const forward = async (m, gss) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";

  // Set your command name here (e.g., "vv" or "forward")
  if (cmd === "save" || cmd === "steal") {
    try {
      // 1. Check if a message is quoted
      if (!m.quoted) {
        return m.reply("*🍁 Please reply to a message (image, video, audio, or doc)!*");
      }

      // 2. Download the media from the quoted message
      const buffer = await m.quoted.download();
      const mtype = m.quoted.mtype;
      const caption = m.quoted.text || "";
      
      // 'm.sender' is the person who sent the command
      const target = m.sender; 

      let messageContent = {};

      // 3. Handle different message types based on your base
      switch (mtype) {
        case "imageMessage":
          messageContent = { image: buffer, caption };
          break;
        case "videoMessage":
          messageContent = { video: buffer, caption, mimetype: 'video/mp4' };
          break;
        case "audioMessage":
          messageContent = { 
              audio: buffer, 
              mimetype: m.quoted.mimetype || "audio/mp4", 
              ptt: m.quoted.ptt || false 
          };
          break;
        case "stickerMessage":
          messageContent = { sticker: buffer };
          break;
        case "documentMessage":
          messageContent = { 
              document: buffer, 
              mimetype: m.quoted.mimetype, 
              fileName: m.quoted.fileName || 'file' 
          };
          break;
        case "conversation":
        case "extendedTextMessage":
          messageContent = { text: m.quoted.text };
          break;
        default:
          return m.reply("❌ This message type is not supported yet.");
      }

      // 4. Send the message to the user's DM (target)
      await gss.sendMessage(target, messageContent);
      
      // 5. Confirm in the current chat if it's a group
      if (m.from !== m.sender) {
          m.reply("_Sent to your Inbox! ✅_");
      }

    } catch (error) {
      console.error("Forward Error:", error);
      m.reply("❌ Error forwarding message:\n" + error.message);
    }
  }
};

export default forward;
