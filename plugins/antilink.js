const { cmd } = require("../command");
const config = require("../config");

// Simple warning memory
const warnings = {};

// === Global Link Detection ===
cmd({ on: "body" }, async (client, message, chat, { from, sender, isGroup, isAdmins, isOwner, body }) => {
    if (!isGroup || isAdmins || isOwner || !config.ANTILINK) return;

    // The most accurate "All Links" regex (Detects domains, IPs, and protocols)
    const allLinksRegex = /((https?:\/\/|www\.)[^\s]+|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[^\s]*)?|(\d{1,3}\.){3}\d{1,3})/gi;

    if (allLinksRegex.test(body)) {
        const mode = config.ANTILINK_MODE || 'delete';

        // 🛡️ 1. Action: Delete Message Immediately
        await client.sendMessage(from, { delete: message.key });

        // 🛡️ 2. Action: Penalty Mode
        if (mode === 'warn') {
            warnings[sender] = (warnings[sender] || 0) + 1;
            if (warnings[sender] >= 3) {
                await client.sendMessage(from, { text: `🚫 @${sender.split("@")[0]} removed for sending links (3/3 warnings).`, mentions: [sender] });
                await client.groupParticipantsUpdate(from, [sender], "remove");
                delete warnings[sender];
            } else {
                await client.sendMessage(from, { 
                    text: `⚠️ *No Links Allowed!* @${sender.split("@")[0]}\nWarning: ${warnings[sender]}/3`, 
                    mentions: [sender] 
                });
            }
        } else if (mode === 'kick') {
            await client.groupParticipantsUpdate(from, [sender], "remove");
            await client.sendMessage(from, { text: `🚫 @${sender.split("@")[0]} was kicked for sending links.`, mentions: [sender] });
        } else {
            // Default: Silent delete + small text
            await client.sendMessage(from, { text: "🚫 *Links are not allowed here!*" });
        }
    }
});

// === Anti-Link Command ===
cmd({
    pattern: "antilink",
    desc: "Toggle and configure Anti-Link",
    category: "group",
    filename: __filename,
},
async (client, message, m, { isGroup, isAdmins, isOwner, from, args, sender }) => {
    if (!isGroup || (!isAdmins && !isOwner)) return;

    const action = args[0]?.toLowerCase();

    // Toggle and Mode setup
    if (action === "on") {
        config.ANTILINK = true;
        return message.reply("✅ Anti-Link *ENABLED*");
    } else if (action === "off") {
        config.ANTILINK = false;
        return message.reply("❌ Anti-Link *DISABLED*");
    } else if (["warn", "kick", "delete"].includes(action)) {
        config.ANTILINK = true;
        config.ANTILINK_MODE = action;
        return message.reply(`⚙️ Anti-Link mode set to: *${action.toUpperCase()}*`);
    }

    // Small explanation menu
    await client.sendMessage(from, {
        image: { url: "https://files.catbox.moe/kiy0hl.jpg" },
        caption: `
*🌟 POPKID ANTI-LINK 🌟*

🛡️ *Status:* ${config.ANTILINK ? "✅ ON" : "❌ OFF"}
⚙️ *Mode:* ${config.ANTILINK_MODE || 'delete'}

*How to use:*
🔹 \`.antilink on\` - Start blocking
🔹 \`.antilink off\` - Stop blocking
🔹 \`.antilink warn\` - 3 warnings then kick
🔹 \`.antilink kick\` - Instant removal
🔹 \`.antilink delete\` - Just delete link

_𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝 🛡️_`,
        contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363289379419860@newsletter',
                newsletterName: '𝐩𝐨𝐩𝐤𝐢𝐝 𝐱𝐦𝐝'
            }
        }
    }, { quoted: message });
});
