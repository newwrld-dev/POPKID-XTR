/**
 * POPKID-MD (Multi-Session Fixed)
 * Optimized for Popkid's command system
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const P = require('pino');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { File } = require('megajs');
const qrcode = require('qrcode-terminal');

// Load base logic
const config = require('./config');
const { sms } = require('./lib');
const GroupEvents = require('./lib/groupevents');
const { cmd, commands } = require('./command');

const prefix = config.PREFIX || '.';

/* ================= MULTI SESSION PATH ================= */

const SESSION_NAME = process.env.SESSION_NAME || 'default';
const PROJECT_ROOT = path.dirname(require.main.filename);
const SESSION_DIR = path.join(PROJECT_ROOT, 'sessions', SESSION_NAME);

/* ================= SESSION AUTH ================= */

if (!fs.existsSync(path.join(SESSION_DIR, 'creds.json'))) {
  if (!config.SESSION_ID) {
    console.log('❌ Missing SESSION_ID in config.js');
    process.exit(1);
  }

  const sessdata = config.SESSION_ID.replace("POPKID;;;", '');
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

  filer.download((err, data) => {
    if (err) throw err;
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    fs.writeFileSync(path.join(SESSION_DIR, 'creds.json'), data);
    console.log(chalk.green("[ 📥 ] Session Auth Loaded ✅"));
  });
}

let conn;

async function connectToWA() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    auth: state,
    version
  });

  conn.ev.on('creds.update', saveCreds);

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectToWA();
    }

    if (connection === 'open') {
      console.log(chalk.green(`\n✅ POPKID-MD (${SESSION_NAME}) IS ONLINE!`));

      try {
        await conn.newsletterFollow("120363289379419860@newsletter");
      } catch {}

      try {
        await conn.groupAcceptInvite("FlzUGQRVGfMAOzr8weDPnc");
      } catch {}

      const welcomeMsg = `*HELLO 👋 (${conn.user.name || 'User'})*
      
╔════════════════╗
║ 🤖 *POPKID-MD CONNECTED*
╠════════════════╣
║ 🔑 *PREFIX* : ${prefix}
║ 🧩 *SESSION* : ${SESSION_NAME}
║ 👨‍💻 *DEV* : POPKID-MD
╚════════════════╝`;

      await conn.sendMessage(conn.user.id, {
        image: { url: 'https://files.catbox.moe/syekq2.jpg' },
        caption: welcomeMsg
      });

      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (plugin.endsWith(".js")) {
          require("./plugins/" + plugin);
        }
      });
    }
  });

  conn.ev.on('messages.upsert', async (mek) => {
    const msg = mek.messages[0];
    if (!msg.message) return;

    const m = sms(conn, msg);
    const body =
      m.type === 'conversation'
        ? m.message.conversation
        : m.type === 'extendedTextMessage'
        ? m.message.extendedTextMessage.text
        : '';

    if (!body.startsWith(prefix)) return;

    const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
    const cmdObj =
      commands.find(c => c.pattern === command) ||
      commands.find(c => c.alias && c.alias.includes(command));

    if (cmdObj) {
      cmdObj.function(conn, mek, m, {
        from: m.chat,
        sender: m.sender,
        reply: (text) => conn.sendMessage(m.chat, { text }, { quoted: m }),
        isOwner: true
      });
    }
  });
}

connectToWA();
