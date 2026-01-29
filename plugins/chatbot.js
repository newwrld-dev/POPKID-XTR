import axios from 'axios';
import config from '../config.cjs';

// This variable stays in memory while the bot is running
let chatbotEnabled = false; 

const chatbotCmd = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Toggle Command
  if (cmd === "chatbot") {
    const arg = body.slice(prefix.length + cmd.length).trim().toLowerCase();
    
    if (arg === "on") {
      chatbotEnabled = true;
      return m.reply("🤖 *Chatbot is now ON.* I will reply to messages automatically.");
    } else if (arg === "off") {
      chatbotEnabled = false;
      return m.reply("😴 *Chatbot is now OFF.* Manual mode engaged.");
    } else {
      return m.reply(`❓ *Usage:* ${prefix}chatbot on/off`);
    }
  }

  // Auto-Reply Logic (Only triggers if the message is NOT a command)
  if (chatbotEnabled && !body.startsWith(prefix) && !m.key.fromMe) {
    try {
      // API Endpoint for human-like AI
      const apiUrl = `https://api.yupra.my.id/api/ai/copilot?text=${encodeURIComponent(body)}`;
      const response = await axios.get(apiUrl);
      const res = response.data;

      // Extract the human-like result
      if (res && res.status === true && res.result) {
        await gss.sendMessage(m.from, { text: res.result }, { quoted: m });
      }
    } catch (error) {
      console.error("CHATBOT AUTO-REPLY ERROR:", error);
    }
  }
};

export default chatbotCmd;
