const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "apk",
    alias: ["app"],
    react: "📲",
    desc: "📥 Download APK directly",
    category: "📁 Download",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ *Please provide an app name!*");

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Fetch APK details from David Cyril API
        // Note: Replace 'YOUR_API_KEY' if the API requires one, otherwise leave it empty
        const apiKey = "YOUR_API_KEY"; 
        const apiUrl = `https://apis.davidcyriltech.my.id/download/apk?text=${encodeURIComponent(q)}&apikey=${apiKey}`;
        
        const response = await axios.get(apiUrl);
        const res = response.data;

        // Check if the API returned a successful result
        if (!res.status || !res.result) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply("❌ *Could not find the app. Please check the name and try again.*");
        }

        const app = res.result;

        // Send app info first (Optional, but looks better)
        const infoMsg = `
📦 *APP DOWNLOADER*

📝 *Name:* ${app.name}
🆔 *Package:* ${app.id}
📅 *Last Updated:* ${app.lastup}
⚖️ *Size:* ${app.size}

_Downloading file... Please wait_ 📥
        `.trim();

        await conn.sendMessage(from, { 
            image: { url: app.icon }, 
            caption: infoMsg 
        }, { quoted: mek });

        // Send the actual APK file
        await conn.sendMessage(from, {
            document: { url: app.dllink },
            mimetype: "application/vnd.android.package-archive",
            fileName: `${app.name}.apk`,
            caption: `✅ *${app.name} Downloaded*\nᴘᴏᴘᴋɪᴅ ᴀᴘᴘs 🤍`
        }, { quoted: mek });

        // ✅ React - success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("APK Download Error:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        reply("❌ *An error occurred while fetching the APK.*");
    }
});
