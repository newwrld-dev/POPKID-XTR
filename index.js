import 'dotenv/config'; 
import pkg from '@whiskeysockets/baileys';
const {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    jidNormalizedUser,
    makeInMemoryStore,
    proto
} = pkg;

import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import zlib from 'zlib';
import { promisify } from 'util';
import config from './config.cjs';
import autoreactPkg from './lib/autoreact.cjs';

const { emojis, doReact } = autoreactPkg;
const app = express();
const PORT = process.env.PORT || 3000;

let useQR = false;
let initialConnection = true;

// --- INITIALIZE STORE (Fizzy-style Persistence) ---
const store = makeInMemoryStore({ 
    logger: pino().child({ level: 'silent', stream: 'store' }) 
});
const storePath = './baileys_store.json';
if (fs.existsSync(storePath)) store.readFromFile(storePath);
setInterval(() => store.writeToFile(storePath), 10_000);

// --- HELPERS ---
const isEnabled = (val) => {
    if (typeof val === 'boolean') return val;
    return String(val).toLowerCase() === "true";
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const logger = pino({ level: "silent" });
const __dirname = path.resolve();
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
            const gunzip = promisify(zlib.gunzip);
            const decompressedBuffer = await gunzip(compressedBuffer);
            await fs.promises.writeFile(credsPath, decompressedBuffer.toString('utf-8'));
            return true;
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
            getMessage: async (key) => { 
                if (store) return (await store.loadMessage(key.remoteJid, key.id))?.message || undefined;
                return { conversation: "POPKID-MD" }; 
            }
        });

        // BIND STORE: Fixes "makeInMemoryStore is not a function" and data loss
        store.bind(Matrix.ev);

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
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        Matrix.public = isEnabled(config.MODE === "public");

        // --- MAIN MESSAGE LISTENER ---
        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                // Run the main Command Handler
                await Handler(chatUpdate, Matrix, logger);

                const mek = chatUpdate.messages[0];
                if (!mek || !mek.message) return;

                const remoteJid = mek.key.remoteJid;
                const participant = mek.key.participant || remoteJid;
                const myId = jidNormalizedUser(Matrix.user.id);

                // --- STATUS (STORY) AUTOMATION ---
                if (remoteJid === 'status@broadcast') {
                    
                    // 1. Auto View Status
                    if (isEnabled(process.env.AUTO_READ_STATUS) || isEnabled(config.AUTO_STATUS_SEEN)) {
                        await Matrix.readMessages([mek.key]);
                        console.log(chalk.cyan(`[VIEWED] Status from: ${participant}`));
                    }

                    // 2. Auto Status Reaction (Anti-Lag)
                    if (isEnabled(process.env.AUTO_STATUS_REACT) || isEnabled(config.AUTO_STATUS_REACT)) {
                        await delay(Math.floor(Math.random() * 2000) + 3000); 

                        const statusEmojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
                        const randomEmoji = statusEmojis[Math.floor(Math.random() * statusEmojis.length)];
                        
                        try {
                            await Matrix.sendMessage(remoteJid, {
                                react: { text: randomEmoji, key: mek.key }
                            }, { 
                                statusJidList: [participant, myId] 
                            });
                        } catch (err) {
                            if (err.message.includes('rate-overlimit')) {
                                console.log(chalk.red(`[RATE-LIMIT] Cooling down 10s...`));
                                await delay(10000);
                            }
                        }
                    }

                    // 3. Auto Status Reply
                    if (isEnabled(process.env.AUTO_STATUS_REPLY)) {
                        const replyMsg = process.env.STATUS_READ_MSG || config.STATUS_READ_MSG;
                        await Matrix.sendMessage(participant, { text: replyMsg }, { quoted: mek });
                    }

                } else {
                    // REGULAR MESSAGE AUTO-REACT
                    if (isEnabled(config.AUTO_REACT) && !mek.key.fromMe) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await doReact(randomEmoji, mek, Matrix);
                    }
                }

            } catch (err) {
                console.error(chalk.red('Error in Master Listener:'), err.message);
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
