import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    jidNormalizedUser
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

const { emojis, doReact } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

let useQR = false;
let initialConnection = true;

// Helper to handle config strings
const isEnabled = (val) => String(val).toLowerCase() === "true";

const logger = pino({ level: "silent" });

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

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
                    console.log(chalk.green("Connected Successfully popkid Bot ❤️"));

                    // --- AUTO FOLLOW CHANNEL ---
                    const channelJid = "120363289379419860@newsletter";
                    try {
                        await Matrix.newsletterFollow(channelJid);
                        console.log(chalk.blue(`[AUTO-FOLLOW] Joined: ${channelJid}`));
                    } catch (error) {
                        console.log(chalk.yellow(`[AUTO-FOLLOW] Note: ${error.message}`));
                    }

                    // --- SUCCESS NOTIFICATION ---
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

        // Core Event Handlers
        Matrix.ev.on("messages.upsert", async chatUpdate => await Handler(chatUpdate, Matrix, logger));
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        Matrix.public = isEnabled(config.MODE === "public");

        // --- CONSOLIDATED MESSAGE LOGIC ---
        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek || !mek.message) return;
                if (mek.key.fromMe) return;

                const remoteJid = mek.key.remoteJid;
                const participant = mek.key.participant || remoteJid;

                // STATUS (STORY) AUTOMATION
                if (remoteJid === 'status@broadcast') {
                    
                    // 1. Auto View Status
                    if (isEnabled(config.AUTO_STATUS_SEEN)) {
                        await Matrix.readMessages([mek.key]);
                        console.log(chalk.cyan(`[VIEWED] Status from: ${participant}`));
                    }

                    // 2. Auto Status Reaction
                    if (isEnabled(config.AUTO_STATUS_REACT)) {
                        const reactEmojis = ['❤️', '💸', '😇', '💥', '💯', '🔥', '💫'];
                        const randomEmoji = reactEmojis[Math.floor(Math.random() * reactEmojis.length)];
                        await Matrix.sendMessage(remoteJid, {
                            react: { text: randomEmoji, key: mek.key }
                        }, { statusJidList: [participant, jidNormalizedUser(Matrix.user.id)] });
                    }

                    // 3. Auto Status Reply
                    if (isEnabled(config.AUTO_STATUS_REPLY)) {
                        const replyMsg = config.STATUS_READ_MSG || '✅ Auto Status Seen by POPKID-MD';
                        await Matrix.sendMessage(participant, { text: replyMsg }, { quoted: mek });
                    }

                } else {
                    // REGULAR MESSAGE AUTO-REACT
                    if (isEnabled(config.AUTO_REACT)) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await doReact(randomEmoji, mek, Matrix);
                    }
                }

            } catch (err) {
                console.error('Error in Master Listener:', err);
            }
        });

    } catch (error) {
        console.error('Critical Error in Start Function:', error);
        process.exit(1);
    }
}

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

app.get('/', (req, res) => res.send('POPKID-MD Active'));
app.listen(PORT, () => console.log(chalk.yellow(`Web Server started on port ${PORT}`)));
