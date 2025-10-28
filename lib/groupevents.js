// Credits popkid 

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

const ppUrls = [
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
    'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
];

const GroupEvents = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString();

            // WELCOME MESSAGE
            if (update.action === "add" && config.WELCOME === "true") {
                const WelcomeText = 
`┏──〔 🤖 *${config.BOT_NAME}* 〕───⊷
┇ *Welcome @${userName} to ${metadata.subject}* 🎉
┇ *You are member number:* ${groupMembersCount}
┇ *Time joined:* ${timestamp}
┇ *Please read group description below*
┗──────────────⊷

┏──〔 📜 *Group Description* 〕───⊷
┇ ${desc}
┗──────────────⊷

> *${config.BOT_NAME} - Connected & Ready*`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: WelcomeText,
                    mentions: [num]
                });

            // GOODBYE MESSAGE
            } else if (update.action === "remove" && config.GOODBYE === "true") {
                const GoodbyeText = 
`┏──〔 🤖 *${config.BOT_NAME}* 〕───⊷
┇ *Goodbye @${userName}* 😔
┇ *Time left:* ${timestamp}
┇ *Members remaining:* ${groupMembersCount}
┗──────────────⊷

> *We'll miss you — ${config.BOT_NAME}*`;

                await conn.sendMessage(update.id, {
                    image: { url: ppUrl },
                    caption: GoodbyeText,
                    mentions: [num]
                });

            // ADMIN DEMOTE
            } else if (update.action === "demote" && config.ADMIN_ACTION === "true") {
                const demoter = update.author.split("@")[0];
                await conn.sendMessage(update.id, {
                    text:
`┏──〔 ⚠️ *Admin Event* 〕───⊷
┇ @${demoter} demoted @${userName}
┇ *Time:* ${timestamp}
┇ *Group:* ${metadata.subject}
┗──────────────⊷`,
                    mentions: [update.author, num]
                });

            // ADMIN PROMOTE
            } else if (update.action === "promote" && config.ADMIN_ACTION === "true") {
                const promoter = update.author.split("@")[0];
                await conn.sendMessage(update.id, {
                    text:
`┏──〔 🎉 *Admin Event* 〕───⊷
┇ @${promoter} promoted @${userName}
┇ *Time:* ${timestamp}
┇ *Group:* ${metadata.subject}
┗──────────────⊷`,
                    mentions: [update.author, num]
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;