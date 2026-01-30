import axios from 'axios';
import config from '../config.cjs';

const geminiAI = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";
  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).split(" ")[0].toLowerCase()
    : "";

  // Command triggers
  if (cmd !== "gemini" && cmd !== "ai") return;

  try {
    const text = body.slice(prefix.length + cmd.length).trim();

    if (!text) {
      return m.reply("🤖 *Please provide a question!*\n\n*Example:* .gemini how do I bake a cake?");
    }

    // Set "Typing" status for a human-like effect
    await gss.sendPresenceUpdate('composing', m.from);

    // Fetch response from BK9 Gemini API
    const apiUrl = `https://api.bk9.dev/ai/gemini?q=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl);
    const res = response.data;

    // Validate the API response
    if (!res || res.status !== true || !res.BK9) {
      return m.reply("❌ *Error:* The AI server is currently unresponsive.");
    }

    // Send the human-like response
    await m.reply(res.BK9);

  } catch (error) {
    console.error("GEMINI CMD ERROR:", error);
    m.reply("⚠️ *System Error:* Unable to connect to Gemini AI.");
  }
};

export default geminiAI;
