const { cmd } = require("../command");
const config = require("../config");

const recentCallers = new Set();

// === Anti-Call Event Handler ===
cmd({ on: "body" }, async (client, message, chat, { from: sender }) => {
  try {
    client.ev.on("call", async (callData) => {
      if (!config.ANTI_CALL) return;

      for (const call of callData) {
        if (call.status === 'offer' && !call.isGroup) {
          // Reject incoming call
          await client.rejectCall(call.id, call.from);

          // Notify only once every 10 minutes per caller
          if (!recentCallers.has(call.from)) {
            recentCallers.add(call.from);

            await client.sendMessage(call.from, {
              text: `📞 *Auto Reject Activated!* ☠️\n\nYou cannot call this number while Anti-Call mode is active.\n\n_Stay in text mode!_`,
              mentions: [call.from]
            });

            // Clear caller after 10 minutes
            setTimeout(() => recentCallers.delete(call.from), 10 * 60 * 1000);
          }
        }
      }
    });
  } catch (error) {
    console.error("❌ Call rejection error:", error);
    await client.sendMessage(sender, { text: `⚠️ Error: ${error.message}` }, { quoted: chat });
  }
});

// === Anti-Call Command ===
cmd({
  pattern: "anticall",
  alias: ["callblock", "togglecall"],
  desc: "Toggle call blocking feature",
  category: "owner",
  react: "📞",
  filename: __filename,
  fromMe: true
},
async (client, message, m, { isOwner, from, sender, args }) => {
  try {
    if (!isOwner) {
      return client.sendMessage(from, {
        text: "🚫 *Owner-only command!*",
        mentions: [sender]
      }, { quoted: message });
    }

    const action = args[0]?.toLowerCase() || 'status';
    let statusText, reaction = "📞", additionalInfo = "";

    switch (action) {
      case 'on':
        if (config.ANTI_CALL) {
          statusText = "📌 Anti-call is already *ENABLED*!";
          reaction = "ℹ️";
        } else {
          config.ANTI_CALL = true;
          statusText = "✅ Anti-call has been *ENABLED*!";
          reaction = "✅";
          additionalInfo = "Calls will now be automatically rejected 🔇";
        }
        break;

      case 'off':
        if (!config.ANTI_CALL) {
          statusText = "📌 Anti-call is already *DISABLED*!";
          reaction = "ℹ️";
        } else {
          config.ANTI_CALL = false;
          statusText = "❌ Anti-call has been *DISABLED*!";
          reaction = "❌";
          additionalInfo = "Calls can now come through ☎️";
        }
        break;

      default:
        statusText = `📌 Anti-call Status: ${config.ANTI_CALL ? "✅ *ENABLED*" : "❌ *DISABLED*"}`;
        additionalInfo = config.ANTI_CALL ? "Calls are being blocked 🔒" : "Calls are allowed ☎️";
        break;
    }

    // Send combined image + newsletter style message
    await client.sendMessage(from, {
      image: { url: "https://files.catbox.moe/kiy0hl.jpg" },
      caption: `
${statusText}
${additionalInfo}

_𝐩𝐨𝐩𝐤𝐢𝐝 𝐚𝐧𝐭𝐢𝐜𝐚𝐥𝐥 🌟_
      `,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: '𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝',
          serverMessageId: 143
        }
      }
    }, { quoted: message });

    // React to original command for visual feedback
    await client.sendMessage(from, {
      react: { text: reaction, key: message.key }
    });

  } catch (error) {
    console.error("❌ Anti-call command error:", error);
    await client.sendMessage(from, {
      text: `⚠️ Error: ${error.message}`,
      mentions: [sender]
    }, { quoted: message });
  }
});
