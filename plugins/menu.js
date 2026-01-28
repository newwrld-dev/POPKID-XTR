import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';

// Professional Byte Converter
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Advanced Runtime Formatter
const runtime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const menu = async (m, Matrix) => {
    const { PREFIX, BOT_NAME, OWNER_NAME, MODE, MENU_IMAGE } = config;
    const cmd = m.body.startsWith(PREFIX) ? m.body.slice(PREFIX.length).split(' ')[0].toLowerCase() : '';
    
    // Time & Status Setup
    const time = moment.tz("Asia/Colombo").format("HH:mm:ss");
    const date = moment.tz("Asia/Colombo").format("DD/MM/YYYY");
    const hour = moment().tz("Asia/Colombo").hour();
    let pushwish = hour < 12 ? "Good Morning 🌄" : hour < 17 ? "Good Afternoon 🌅" : hour < 21 ? "Good Evening 🌃" : "Good Night 🌌";

    const validCommands = ['list', 'help', 'menu'];

    if (validCommands.includes(cmd)) {
        const mainMenu = `
✨ *ＨＥＬＬＯ, ${m.pushName.toUpperCase()}* ✨

╭━━〔 *${BOT_NAME}* 〕━━┈⊷
┃ 👤 *Owner:* ${OWNER_NAME}
┃ 🔋 *RAM:* ${formatBytes(os.freemem())} / ${formatBytes(os.totalmem())}
┃ 🕒 *Time:* ${time}
┃ 📅 *Date:* ${date}
┃ ⏳ *Uptime:* ${runtime(process.uptime())}
┃ ⚙️ *Platform:* ${os.platform()}
┃ 🔐 *Mode:* ${MODE}
┃ 🏷️ *Prefix:* [ ${PREFIX} ]
╰━━━━━━━━━━━━━━━┈⊷

> ${pushwish}! 

╭━━〔 *DOWNLOADER* 〕━━┈⊷
┃ ◈ apk
┃ ◈ facebook
┃ ◈ mediafire
┃ ◈ pinterestdl
┃ ◈ gitclone
┃ ◈ gdrive
┃ ◈ insta
┃ ◈ ytmp3
┃ ◈ ytmp4
┃ ◈ play
┃ ◈ song
┃ ◈ video
┃ ◈ tiktok
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *CONVERTER* 〕━━┈⊷
┃ ◈ attp
┃ ◈ attp2
┃ ◈ attp3
┃ ◈ ebinary
┃ ◈ dbinary
┃ ◈ emojimix
┃ ◈ mp3
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *AI MODELS* 〕━━┈⊷
┃ ◈ ai
┃ ◈ gpt
┃ ◈ dalle
┃ ◈ remini
┃ ◈ gemini
┃ ◈ bug
┃ ◈ report
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *TOOLS* 〕━━┈⊷
┃ ◈ calculator
┃ ◈ tempmail
┃ ◈ checkmail
┃ ◈ trt
┃ ◈ tts
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *GROUP* 〕━━┈⊷
┃ ◈ linkgroup
┃ ◈ setppgc
┃ ◈ setname
┃ ◈ setdesc
┃ ◈ group
┃ ◈ gcsetting
┃ ◈ welcome
┃ ◈ add
┃ ◈ kick
┃ ◈ hidetag
┃ ◈ tagall
┃ ◈ antilink
┃ ◈ promote
┃ ◈ demote
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *SEARCH* 〕━━┈⊷
┃ ◈ play
┃ ◈ yts
┃ ◈ imdb
┃ ◈ google
┃ ◈ gimage
┃ ◈ pinterest
┃ ◈ wallpaper
┃ ◈ ringtone
┃ ◈ lyrics
╰━━━━━━━━━━━━━━━┈⊷

╭━━〔 *OWNER* 〕━━┈⊷
┃ ◈ join
┃ ◈ leave
┃ ◈ block
┃ ◈ unblock
┃ ◈ setppbot
┃ ◈ anticall
┃ ◈ setstatus
┃ ◈ autotyping
┃ ◈ autoread
╰━━━━━━━━━━━━━━━┈⊷

   *© 2026 ${BOT_NAME}*
`;

        const getMenuImage = async () => {
            try {
                if (MENU_IMAGE) {
                    const res = await axios.get(MENU_IMAGE, { responseType: 'arraybuffer' });
                    return Buffer.from(res.data);
                }
                return fs.readFileSync('./media/zenor.jpeg');
            } catch {
                return fs.readFileSync('./media/zenor.jpeg');
            }
        };

        const image = await getMenuImage();

        await Matrix.sendMessage(m.from, {
            image: image,
            caption: mainMenu,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363289379419860@newsletter',
                    newsletterName: "Popkid Updates",
                    serverMessageId: 143
                }
            }
        }, { quoted: m });

        await Matrix.sendMessage(m.from, {
            audio: { url: 'https://github.com/XdTechPro/KHAN-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: m });
    }
};

export default menu;
