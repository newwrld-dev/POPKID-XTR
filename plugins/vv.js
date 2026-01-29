import config from '../config.cjs';

const viewonce = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  if (cmd !== "viewonce" && cmd !== "vv") return;

  try {
    if (!m.quoted) {
      return m.reply("*🍁 Reply to a view-once image or video!*");
    }

    // 🔥 Deep extract quoted message (status-safe)
    const quotedMessage =
      m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
      m.quoted?.message;

    const quotedImage = quotedMessage?.imageMessage;
    const quotedVideo = quotedMessage?.videoMessage;

    let buffer;
    let messageContent;

    if (quotedImage?.viewOnce) {
      buffer = await m.quoted.download();
      if (!buffer) return m.reply("❌ Failed to download image.");

      messageContent = {
        image: buffer,
        caption: quotedImage.caption || "",
      };

    } else if (quotedVideo?.viewOnce) {
      buffer = await m.quoted.download();
      if (!buffer) return m.reply("❌ Failed to download video.");

      messageContent = {
        video: buffer,
        caption: quotedVideo.caption || "",
        mimetype: quotedVideo.mimetype || "video/mp4",
      };

    } else {
      return m.reply("❌ Please reply to a view-once image or video.");
    }

    // Send unlocked media to inbox
    await gss.sendMessage(m.sender, messageContent);

    if (m.from !== m.sender) {
      await m.reply("_View Once unlocked & sent to your Inbox ✅_");
    }

  } catch (err) {
    console.error("VIEWONCE CMD ERROR:", err);
    m.reply("❌ Error unlocking view-once:\n" + err.message);
  }
};

export default viewonce;
