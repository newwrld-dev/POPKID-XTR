/**
 * POPKID-MD (Fixed Integrated Base)
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

// Load your base logic
const config = require('./config');
const { sms, AntiDelete } = require('./lib');
const { saveMessage } = require('./data');
const GroupEvents = require('./lib/groupevents');

// This is your specific command handler
const { cmd, commands } = require('./command');

const prefix = config.PREFIX || '.';

// ============ SESSION-AUTH ============
if (!fs.existsSync(__dirname + '/sessions/creds.json')) {
  if (!config.SESSION_ID) {
      console.log('❌ Missing SESSION_ID in config.js');
      process.exit(1);
  }
  const sessdata = config.SESSION_ID.replace("POPKID;;;", '');
  const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);
  filer.download((err, data) => {
    if (err) throw err;
    fs.writeFile(__dirname + '/sessions/creds.json', data, () => {
      console.log(chalk.green("[ 📥 ] Session Auth Loaded ✅"));
    });
  });
}

let conn;

async function connectToWA() {
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/');
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
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) connectToWA();
    } 
    
    else if (connection === 'open') {
      console.log(chalk.green(`\n✅ POPKID-MD IS ONLINE!`));

      // 1. Auto Newsletter Follow
      try {
        await conn.newsletterFollow("120363289379419860@newsletter");
      } catch (e) {}

      // 2. Auto Join Group
      try {
        await conn.groupAcceptInvite("FlzUGQRVGfMAOzr8weDPnc");
      } catch (e) {}

      // 3. Welcome Message with your styling
      const welcomeMsg = `*HELLO 👋 (${conn.user.name || 'User'})*
      
╔════════════════╗
║ 🤖 *POPKID-MD CONNECTED*
╠════════════════╣
║ 🔑 *PREFIX* : ${prefix}
║ 👨‍💻 *DEV* : POPKID-MD
║ 📞 *DEV NO* : 254732297194
╚════════════════╝`;

      await conn.sendMessage(conn.user.id, {
        image: { url: 'https://files.catbox.moe/syekq2.jpg' },
        caption: welcomeMsg,
        contextInfo: {
          externalAdReply: {
            title: "𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃",
            body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴍᴅ",
            thumbnailUrl: "https://files.catbox.moe/syekq2.jpg",
            sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
            mediaType: 1
          }
        }
      });

      // Load your plugins
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          require("./plugins/" + plugin);
        }
      });
    }
  });

  conn.ev.on('messages.upsert', async (mek) => {
    const msg = mek.messages[0];
    if (!msg.message) return;
    const m = sms(conn, msg);
    
    // Command Processing logic here (passes to your plugins)
    const body = (m.type === 'conversation') ? m.message.conversation : (m.type === 'extendedTextMessage') ? m.message.extendedTextMessage.text : '';
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : false;

    if (isCmd) {
        const cmdObj = commands.find((c) => c.pattern === command) || commands.find((c) => c.alias && c.alias.includes(command));
        if (cmdObj) {
            cmdObj.function(conn, mek, m, {
                from: m.chat,
                quoted: m,
                body: body,
                isCmd,
                command,
                args: body.trim().split(/ +/).slice(1),
                isGroup: m.isGroup,
                sender: m.sender,
                reply: (text) => conn.sendMessage(m.chat, { text }, { quoted: m }),
                isOwner: ownerNumber.includes(m.sender.split('@')[0])
            });
        }
    }
  });
}

connectToWA();
