const { cmd } = require("../command");
const config = require("../config");

// Memory for warnings
const userWarnings = new Set();
const warningCount = {};

// === Anti-Link Event Handler ===
cmd({ on: "body" }, async (client, message, chat, { from, sender, isGroup, isAdmins, isOwner, body }) => {
  try {
    // Basic checks: Only groups, no admins, no owner, must be enabled
    if (!isGroup || isAdmins || isOwner || !config.ANTI_LINK) return;

    // Accurate Regex for ALL links (http, https, www, and domains like .com, .net, .ke, etc.)
    const linkRegex = /((https?:\/\/|www\.)[^\s]+|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?)/gi;

    if (linkRegex.test(body)) {
      const mode = config.ANTILINK_MODE || 'delete';

      // 1. Delete the message first
      await client.sendMessage(from, { delete: message.key });

      // 2. Handle Actions (Warn, Kick, or just Delete)
      if (mode === 'warn') {
        warningCount[sender] = (warningCount[sender] || 0) + 1;
        
        if (warningCount[sender] >= 3) {
          await client.sendMessage(from, { text: `🚫 @${sender.split("@")[0]} reached 3/3 warnings and has been removed.`, mentions: [sender] });
          await client.groupParticipantsUpdate(from, [sender], "remove");
          delete warningCount[sender];
        } else {
          await client.sendMessage(from, { 
            text: `⚠️ *Link Detected!* @${sender.split("@")[0]}\n\nWarning: ${warningCount[sender]}/3\n_Sending links is strictly prohibited!_`, 
            mentions: [sender] 
          });
        }
      } 
      
      else if (mode === 'kick') {
        await client.sendMessage(from, { text: `🚫 *Link Detected!* @${sender.split("@")[0]} has been kicked.`, mentions: [sender] });
        await client.groupParticipantsUpdate(from, [sender], "remove");
      } 
      
      else {
        // Mode: Delete only
        await client.sendMessage(from, { text: `🚫 *Links are not allowed here!*` });
      }
    }
  } catch (error) {
    console.error("❌ Anti-link handler error:", error);
  }
});

// === Anti-Link Command ===
cmd({
  pattern: "antilink",
  alias: ["alink", "blocklink"],
  desc: "Toggle and configure link blocking",
  category: "group",
  react: "🔗",
  filename: __filename,
},
async (client, message, m, { isGroup, isAdmins, isOwner, from, sender, args }) => {
  try {
    if (!isGroup) return message.reply("This command is only for groups!");
    if (!isAdmins && !isOwner) {
      return client.sendMessage(from, {
        text: "🚫 *Admin-only command!*",
        mentions: [sender]
      }, { quoted: message });
    }

    const action = args[0]?.toLowerCase() || 'status';
    let statusText, reaction = "🔗", additionalInfo = "";

    switch (action) {
      case 'on':
        config.ANTI_LINK = true;
        statusText = "✅ Anti-link has been *ENABLED*!";
        reaction = "✅";
        additionalInfo = "All links will now be monitored 🛡️";
        break;

      case 'off':
        config.ANTI_LINK = false;
        statusText = "❌ Anti-link has been *DISABLED*!";
        reaction = "❌";
        additionalInfo = "Links are now allowed in this group 🔓";
        break;

      case 'warn':
      case 'kick':
      case 'delete':
        config.ANTI_LINK = true;
        config.ANTILINK_MODE = action;
        statusText = `⚙️ Mode set to *${action.toUpperCase()}*`;
        reaction = "🛡️";
        additionalInfo = `Bot will now ${action} users sending links.`;
        break;

      default:
        statusText = `📌 Anti-link Status: ${config.ANTI_LINK ? "✅ *ENABLED*" : "❌ *DISABLED*"}`;
        additionalInfo = `Current Mode: *${config.ANTILINK_MODE || 'delete'}*\n\n*Usage:* \n.antilink on/off\n.antilink warn/kick/delete`;
        break;
    }

    // Send combined image + newsletter style message
    await client.sendMessage(from, {
      image: { url: "https://files.catbox.moe/kiy0hl.jpg" },
      caption: `
${statusText}
${additionalInfo}

_𝐩𝐨𝐩𝐤𝐢𝐝 𝐚𝐧𝐭𝐢𝐥𝐢𝐧𝐤 🛡️_
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

    // React to original command
    await client.sendMessage(from, {
      react: { text: reaction, key: message.key }
    });

  } catch (error) {
    console.error("❌ Anti-link command error:", error);
    await client.sendMessage(from, {
      text: `⚠️ Error: ${error.message}`,
      mentions: [sender]
    }, { quoted: message });
  }
});
