const { cmd } = require("../command");
const config = require("../config");
const fetch = require("node-fetch");

// === AI Chatbot Event Handler ===
// This listener checks every message to see if it should reply
cmd({ on: "body" }, async (client, message, chat, { from, body, isGroup, isCmd }) => {
  try {
    // 1. SMART FILTERS: Only reply if AI is ON, it's NOT a command, NOT a group, and NOT from the bot itself
    if (config.AUTO_AI === "true" && !isCmd && !isGroup && !message.key.fromMe && body) {
      
      // 2. Realistic "typing..." presence
      await client.sendPresenceUpdate('composing', from);

      // 3. Fetch response from David Cyril API
      const apiKey = ""; // Add your apikey here if required
      const apiUrl = `https://apis.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(body)}&apikey=${apiKey}`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 200 || data.success) {
        const aiReply = data.result;

        // 4. Send the smart reply with your brand styling
        await client.sendMessage(from, {
          text: `${aiReply}\n\n> © ᴘᴏᴘᴋɪᴅ ᴍᴅ ᴀɪ 🤖`,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363289379419860@newsletter',
              newsletterName: '𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝 𝐀𝐈',
              serverMessageId: 143
            }
          }
        }, { quoted: message });
      }
    }
  } catch (error) {
    console.error("❌ Chatbot Error:", error);
  }
});

// === Chatbot Toggle Command ===
// Use this to turn the AI on or off
cmd({
  pattern: "chatbot",
  alias: ["autoai", "aichat"],
  desc: "Toggle Auto AI Chatbot feature",
  category: "owner",
  react: "🤖",
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
    let statusText, reaction = "🤖", additionalInfo = "";

    switch (action) {
      case 'on':
        if (config.AUTO_AI === "true") {
          statusText = "📌 AI Chatbot is already *ENABLED*!";
          reaction = "ℹ️";
        } else {
          config.AUTO_AI = "true";
          statusText = "✅ AI Chatbot has been *ENABLED*!";
          reaction = "✅";
          additionalInfo = "I will now reply to all private messages 💬";
        }
        break;

      case 'off':
        if (config.AUTO_AI === "false") {
          statusText = "📌 AI Chatbot is already *DISABLED*!";
          reaction = "ℹ️";
        } else {
          config.AUTO_AI = "false";
          statusText = "❌ AI Chatbot has been *DISABLED*!";
          reaction = "❌";
          additionalInfo = "Auto-replies are now turned off 🔇";
        }
        break;

      default:
        statusText = `📌 Chatbot Status: ${config.AUTO_AI === "true" ? "✅ *ENABLED*" : "❌ *DISABLED*"}`;
        additionalInfo = config.AUTO_AI === "true" ? "Ready to chat 🤖" : "Standing by 💤";
        break;
    }

    // Send combined image + newsletter style message
    await client.sendMessage(from, {
      image: { url: "https://files.catbox.moe/kiy0hl.jpg" },
      caption: `
${statusText}
${additionalInfo}

_𝐩𝐨𝐩𝐤𝐢𝐝 𝐜𝐡𝐚𝐭𝐛𝐨𝐭 🌟_
      `,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363289379419860@newsletter',
          newsletterName: '𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝 𝐀𝐈',
          serverMessageId: 143
        }
      }
    }, { quoted: message });

    // React to original command for visual feedback
    await client.sendMessage(from, {
      react: { text: reaction, key: message.key }
    });

  } catch (error) {
    console.error("❌ Chatbot command error:", error);
    await client.sendMessage(from, {
      text: `⚠️ Error: ${error.message}`,
      mentions: [sender]
    }, { quoted: message });
  }
});
