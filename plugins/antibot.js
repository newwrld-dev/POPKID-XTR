const { cmd } = require('../command');
const fs = require('fs');
const filePath = './plugins/antibot-status.json';

// ✅ Create antibot status file if missing
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ enabled: false }, null, 2));
}

// ✅ Load antibot status
let antibotStatus = JSON.parse(fs.readFileSync(filePath));

// 💾 Save function
function saveStatus() {
    fs.writeFileSync(filePath, JSON.stringify(antibotStatus, null, 2));
}

// 🔢 Message counter for suspected bots
let botMessageCount = {};

//==============================//
//   🧠 COMMAND: .antibot on/off
//==============================//
cmd({
    pattern: "antibot",
    alias: ["botblock", "banbot", "abot", "anbot", "antbot", "kbot", "kickbot"],
    desc: "Enable or disable AntiBot system in the group.",
    category: "group",
    react: "😌",
    use: ".antibot on/off",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    const args = q.trim().toLowerCase();

    if (args === 'on') {
        antibotStatus.enabled = true;
        saveStatus();
        reply('*IS GROUP ME ❮ANTIBOT❯ ON HO GAYA HAI ☺️ AB AP SAB GROUP WALO SE GUZARISH HAI 🥺 KE APNE BOTS PRIVATE KAR LO 🙂 YA GROUP LEFT KAR LO 😇 WO APKI MERZI HAI 😅 AGAR MUJHE IS GROUP ME KOI DUSRA BOT 🤨 NAZAR AYA TO WO REMOVE HOGA 😏 PHIR BAD ME MUJHE MAT KEHNA 🙄 KE HUME PEHLE BATAYA NAHI 😒*');
    } else if (args === 'off') {
        antibotStatus.enabled = false;
        saveStatus();
        reply('*IS GROUP ME ❮ANTIBOT❯ OFF KAR DYA GAYA HAI 🙂 AB AP SAB APNE BOTS IS GROUP 😃 ME USE KAR SAKTE HAI ☺️❤️*');
    } else {
        reply(`*AP ESE LIKHO ☺️* \n\n *ANTIBOT ON ❮ANTIBOT ON KARNE K LIE❯* \n\n *ANTIBOT OFF ❮ANTIBOT OFF KARNE K LIE❯* \n\n\n *ABHI ${antibotStatus.enabled ? '✅ ON' : '❌ OFF'} HAI 😇*`);
    }
});

//==============================//
//   🤖 AUTO CHECK HANDLER
//==============================//
cmd({
    on: "message"
}, async (conn, mek, m, { isAdmin, isBotAdmin }) => {
    try {
        if (!m.isGroup || m.fromMe) return;
        if (!antibotStatus.enabled) return;

        // 📜 Regex patterns for bot message IDs
        const botPatterns = [
            /^3EBO/, /^4EBO/, /^5EBO/, /^6EBO/, /^7EBO/, /^8EBO/,
            /^9EBO/, /^AEBO/, /^BEBO/, /^CEBO/, /^DEBO/, /^EEBO/,
            /^FEBO/, /^ABE5/, /^BAE7/, /^CAEBO/, /^DAEBO/, /^FAEBO/
        ];

        // 🕵️ Check for suspected bot message
        if (botPatterns.some(rx => rx.test(m.key.id)) && m.key.remoteJid.endsWith('@g.us')) {
            const sender = m.key.participant;
            botMessageCount[sender] = (botMessageCount[sender] || 0) + 1;

            console.log(`YEH  ${sender} KOI OR BOT USE KAR RAHE HAI 😐*\n\n *BOT KA MSG DEKHO 👇 \n\n (${botMessageCount[sender]} messages)*`);

            // 🚨 If same sender sends 5+ suspicious messages
            if (botMessageCount[sender] >= 5) {
                if (isBotAdmin) {
                    await conn.groupParticipantsUpdate(m.chat, [sender], 'remove');
                    await conn.sendMessage(m.chat, {
                        text: `*MENE ISKO REMOVE KAR DIYA HAI 🥺\n@${sender.split('@')[0]}*\n\n *Q KE INKE PAS KOI OR BOT HAI 😒*`,
                        mentions: [sender]
                    });
                    delete botMessageCount[sender];
                } else {
                    m.reply('*PEHLE MUJHE IS GROUP ME ADMIN BANAO 🥺 YAHA PER IS GROUP DUSRE BOTS ACTIVE HAI 🙄 JO SPAM MSGS BHEJ RAHE HAI ☹️ IN SE HAMARY WHATSAPP BAN BHI HO SAKTY HAI 😥 AP MUJHE ADMIN BANAO 🙂 HUM IN SAB BOTS KO REMOVE KAR DE GE ☺️❤️* \n\n *GROUP ADMINS 🙄*');
                }
            }
        }
    } catch (e) {
        console.error('*ANTIBOT ERROR 🥺*', e);
    }
});
