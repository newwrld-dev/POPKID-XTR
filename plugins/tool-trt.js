const { cmd } = require('../command');
const fetch = require('node-fetch');

cmd({
    pattern: "trt",
    alias: ["translate", "trans"],
    react: "🌐",
    desc: "Translate text to any language.",
    category: "tools",
    use: ".trt fr Hello, how are you?",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚙️ *SYSTEM:* Missing input.\n\n*Usage:* .trt <lang_code> <text>\n*Example:* .trt fr Hello");

        // Split the language code (fr, es, ar, etc) from the actual text
        const args = q.split(" ");
        const targetLang = args[0]; 
        const textToTranslate = args.slice(1).join(" ");

        if (!textToTranslate) return await reply("❌ *ERROR:* Please provide the text you want to translate.");

        // Initial loading message
        const { key } = await conn.sendMessage(from, { text: "🔄 *TRANSLATING:* Processing request..." });

        const apiUrl = `https://apis.davidcyriltech.my.id/tools/translate?text=${encodeURIComponent(textToTranslate)}&to=${targetLang}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) {
            return await conn.sendMessage(from, { text: "❌ *FATAL ERROR:* Translation service unavailable.", edit: key });
        }

        // Final Output
        let resultMsg = `╔═════════════╗
  ✰  *𝐓𝐑𝐀𝐍𝐒𝐋𝐀𝐓𝐄 𝐂𝐎𝐑𝐄* ✰
╟────────────╢
│ 🌐 **FROM:** Auto-Detect
│ 🎯 **TO:** ${targetLang.toUpperCase()}
╟────────────╢
│ 📝 **RESULT:** │ ${data.result}
╚═════════════╝`;

        await conn.sendMessage(from, { text: resultMsg, edit: key });

    } catch (error) {
        console.error(error);
        await reply(`❌ **SYSTEM ERROR:** ${error.message}`);
    }
});
