import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    jidNormalizedUser,
    getContentType
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import zlib from 'zlib';
import { promisify } from 'util';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';

const { emojis: generalEmojis, doReact } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

let useQR = false;
let initialConnection = true;

// --- UTILS ---
const isEnabled = (val) => {
    if (typeof val === 'boolean') return val;
    return String(val).toLowerCase() === "true";
};

const delay = ms => new Promise(res => setTimeout(res, ms));
const logger = pino({ level: "silent" });

// --- PATHS ---
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

// --- SESSION LOADER ---
async function loadGiftedSession() {
    if (!config.SESSION_ID) return false;
    if (config.SESSION_ID.startsWith("POPKID~")) {
        const compressedBase64 = config.SESSION_ID.substring("POPKID~".length);
        try {
            const compressedBuffer = Buffer.from(compressedBase64, 'base64');
            if (compressedBuffer[0] === 0x1f && compressedBuffer[1] === 0x8b) {
                const gunzip = promisify(zlib.gunzip);
                const decompressedBuffer = await gunzip(compressedBuffer);
                await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
                return true;
            }
        } catch (error) { return false; }
    }
    return false;
}

// --- MAIN START FUNCTION ---
async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();
        
        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: Browsers.macOS("Desktop"),
            auth: state,
            getMessage: async (key) => { return { conversation: "POPKID-MD" }; }
        });

        // --- CONNECTION HANDLER ---
        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(chalk.red(`Connection closed. Reconnecting: ${shouldReconnect}`));
                if (shouldReconnect) start();
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Connected Successfully Popkid Bot ❤️"));

                    // Auto-Follow Channel
                    const channelJid = "120363289379419860@newsletter";
                    try {
                        await Matrix.newsletterFollow(channelJid);
                        console.log(chalk.blue(`[AUTO-FOLLOW] Joined: ${channelJid}`));
                    } catch (e) {}

                    // Success Notification
                    const myId = jidNormalizedUser(Matrix.user.id);
                    await Matrix.sendMessage(myId, { 
                        image: { url: "https://files.catbox.moe/kiy0hl.jpg" }, 
                        caption: `\n\nHELLO POPKID-MD USER (${Matrix.user.name || 'User'})\n\n╔════════════════╗\n║ 🤖 CONNECTED\n╠════════════════╣\n║ 🔑 PREFIX : ${config.PREFIX}\n║ 👨‍💻 DEV : POPKID-MD\n╚════════════════╝`
                    });
                    initialConnection = false;
                }
            }
        });
        
        Matrix.ev.on('creds.update', saveCreds);

        // --- EVENT HANDLERS ---
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        Matrix.public = isEnabled(config.MODE === "public");

        // --- MESSAGE LISTENER ---
        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                // Command Handler
                await Handler(chatUpdate, Matrix, logger);

                const mek = chatUpdate.messages[0];
                if (!mek || !mek.message) return;

                const remoteJid = mek.key.remoteJid;
                const myId = jidNormalizedUser(Matrix.user.id);

                // --- STATUS (STORY) AUTOMATION ---
                if (remoteJid === 'status@broadcast') {
                    try {
                        const shouldRead = isEnabled(config.AUTO_READ_STATUS) || isEnabled(config.AUTO_STATUS_SEEN) || isEnabled(process.env.AUTO_READ_STATUS);
                        const shouldReact = isEnabled(config.AUTO_REACT_STATUS) || isEnabled(process.env.AUTO_STATUS_REACT);
                        const shouldReply = isEnabled(process.env.AUTO_STATUS_REPLY);

                        const statusParticipant = mek.key.participant || null;

                        if (statusParticipant) {
                            // Resolve LID -> Real JID Logic
                            let realJid = statusParticipant;
                            if (statusParticipant.endsWith('@lid')) {
                                const rawPn = mek.key?.participantPn || mek.key?.senderPn;
                                if (rawPn) {
                                    realJid = rawPn.includes('@') ? rawPn : `${rawPn}@s.whatsapp.net`;
                                } else {
                                    try {
                                        const resolved = await Matrix.getJidFromLid(statusParticipant);
                                        if (resolved) realJid = resolved;
                                    } catch {}
                                }
                            }

                            const resolvedKey = { ...mek.key, participant: realJid };
                            const statusType = getContentType(mek.message) || 'unknown';

                            // 1. Auto View
                            if (shouldRead || shouldReact) {
                                await Matrix.readMessages([resolvedKey]);
                                console.log(chalk.cyan(`[VIEWED] Status from: ${realJid}`));
                            }

                            // 2. Auto React
                            const reactableTypes = ['imageMessage', 'videoMessage', 'extendedTextMessage', 'conversation', 'audioMessage', 'documentMessage', 'stickerMessage', 'contactMessage', 'locationMessage'];
                            
                            if (shouldReact && reactableTypes.includes(statusType)) {
                                // Prevent Spam/Rate Limit
                                await delay(Math.floor(Math.random() * 2000) + 1000); 

                                const statusEmojis = ['🧩', '🍉', '💜', '🌸', '🪴', '💊', '💫', '🍂', '🌟', '🎋', '😶‍🌫️', '🫀', '🧿', '👀', '🤖', '🚩', '🥰', '🗿', '💜', '💙', '🌝', '🖤', '💚'];
                                const randomEmoji = statusEmojis[Math.floor(Math.random() * statusEmojis.length)];
                                
                                try {
                                    await Matrix.sendMessage(remoteJid, {
                                        react: { key: resolvedKey, text: randomEmoji }
                                    }, { 
                                        statusJidList: [realJid, myId] 
                                    });
                                } catch (err) {
                                    if (err.message.includes('rate-overlimit')) {
                                        await delay(5000);
                                    }
                                }
                            }

                            // 3. Auto Status Reply
                            if (shouldReply) {
                                const replyMsg = process.env.STATUS_READ_MSG || config.STATUS_READ_MSG || "Seen by Popkid-MD";
                                await Matrix.sendMessage(realJid, { text: replyMsg }, { quoted: mek });
                            }
                        }
                    } catch (e) {
                        console.log(chalk.red("Status Auto-Error: "), e.message);
                    }

                } else {
                    // --- REGULAR MESSAGE AUTO-REACT ---
                    if (isEnabled(config.AUTO_REACT) && !mek.key.fromMe) {
                        const randomEmoji = generalEmojis[Math.floor(Math.random() * generalEmojis.length)];
                        await doReact(randomEmoji, mek, Matrix);
                    }
                }

            } catch (err) {
                console.error(chalk.red('Error in Master Listener:'), err.message);
            }
        });

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

// --- INITIALIZATION ---
async function init() {
    if (fs.existsSync(credsPath)) {
        await start();
    } else {
        const loaded = await loadGiftedSession();
        if (loaded) {
            await start();
        } else {
            useQR = true;
            await start();
        }
    }
}

init();

// --- WEB SERVER ---
app.get('/', (req, res) => res.send('POPKID-MD Active'));
app.listen(PORT, () => console.log(chalk.yellow(`Web Server started on port ${PORT}`)));
