import fs from "fs";
import path from "path";
import config from "../config.cjs";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

const STORE = new Map();
const CONFIG_FILE = "./data/antidelete.json";

// Load config
const loadConfig = () => {
  if (!fs.existsSync(CONFIG_FILE)) return { enabled: false };
  return JSON.parse(fs.readFileSync(CONFIG_FILE));
};

// Save config
const saveConfig = (data) => {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
};

// ================= COMMAND =================
export const antideleteCommand = async (m, gss) => {
  const prefix = config.PREFIX;
  const body = m.body || "";

  const cmd = body.startsWith(prefix)
    ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
    : "";

  if (cmd !== "antidelete") return;

  const arg = body.split(" ")[1];
  const conf = loadConfig();

  if (!arg) {
    return m.reply(
      `🛡️ *ANTIDELETE*\n\nStatus: ${
        conf.enabled ? "✅ ON" : "❌ OFF"
      }\n\nUse:\n.antidelete on\n.antidelete off`
    );
  }

  if (arg === "on") conf.enabled = true;
  if (arg === "off") conf.enabled = false;

  saveConfig(conf);
  m.reply(`✅ Antidelete ${conf.enabled ? "enabled" : "disabled"}`);
};

// ================= STORE MESSAGES =================
export const storeMessage = async (m) => {
  try {
    const conf = loadConfig();
    if (!conf.enabled) return;
    if (!m.key?.id) return;

    let data = {
      sender: m.sender,
      chat: m.from,
      text: "",
      media: null,
      type: null,
    };

    if (m.message?.conversation) {
      data.text = m.message.conversation;
    }

    if (m.message?.extendedTextMessage?.text) {
      data.text = m.message.extendedTextMessage.text;
    }

    const mediaTypes = [
      "imageMessage",
      "videoMessage",
      "audioMessage",
      "stickerMessage",
      "documentMessage",
    ];

    for (const type of mediaTypes) {
      if (m.message?.[type]) {
        const stream = await downloadContentFromMessage(
          m.message[type],
          type.replace("Message", "")
        );

        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        data.media = buffer;
        data.type = type;
        data.text = m.message[type]?.caption || "";
      }
    }

    STORE.set(m.key.id, data);

    // auto clean after 5 minutes
    setTimeout(() => STORE.delete(m.key.id), 300000);
  } catch (e) {
    console.log("Store error:", e.message);
  }
};

// ================= HANDLE DELETE =================
export const handleDelete = async (m, gss) => {
  try {
    const conf = loadConfig();
    if (!conf.enabled) return;

    const key = m.message?.protocolMessage?.key?.id;
    if (!key) return;

    const saved = STORE.get(key);
    if (!saved) return;

    const owner = gss.user.id.split(":")[0] + "@s.whatsapp.net";

    let caption =
      `🗑️ *DELETED MESSAGE*\n` +
      `👤 From: @${saved.sender.split("@")[0]}\n\n` +
      (saved.text || "");

    if (!saved.media) {
      await gss.sendMessage(owner, {
        text: caption,
        mentions: [saved.sender],
      });
    } else {
      const msg = { caption, mentions: [saved.sender] };

      if (saved.type === "imageMessage") msg.image = saved.media;
      if (saved.type === "videoMessage") msg.video = saved.media;
      if (saved.type === "audioMessage") msg.audio = saved.media;
      if (saved.type === "stickerMessage") msg.sticker = saved.media;
      if (saved.type === "documentMessage") msg.document = saved.media;

      await gss.sendMessage(owner, msg);
    }

    STORE.delete(key);
  } catch (e) {
    console.log("Antidelete error:", e.message);
  }
};
