import config from '../../config.cjs';
import moment from 'moment-timezone';

const LogoCmd = async (m, Matrix) => {
    const prefix = config.PREFIX;
    const userName = m.pushName || "User";
    const body = m.body || '';
    
    // Determine the command used
    const cmd = body.startsWith(prefix) 
        ? body.slice(prefix.length).split(" ")[0].toLowerCase() 
        : '';

    // Only respond if the command is menu or help
    if (cmd === "menu" || cmd === "help") {
        try {
            // Reaction: Loading
            await Matrix.sendMessage(m.from, {
                react: { text: '⏳', key: m.key }
            });

            // Invisible character padding for message styling
            const readMore = String.fromCharCode(8206).repeat(4001);

            // Helper: Format uptime
            const uptimeSec = process.uptime();
            const h = Math.floor(uptimeSec / 3600);
            const m_ = Math.floor(uptimeSec % 3600 / 60);
            const s = Math.floor(uptimeSec % 60);
            const uptime = `${h}h ${m_}m ${s}s`;

            // Helper: Get greeting
            const hour = moment().tz("Africa/Dar_es_Salaam").hour();
            let greeting = "🌙 Good Night";
            if (hour < 12) greeting = "🌄 Good Morning";
            else if (hour < 17) greeting = "☀️ Good Afternoon";
            else if (hour < 20) greeting = "🌇 Good Evening";

            // Build Menu String
            const menuText = `
╭──❍「POPKID XMD BOT」❍
│ Hi! 👋
│ Name : ${userName}
│ ${greeting} 
╰─┬────❍
╭─┴❍「BOT STATUS」❍
│ mode: ${config.MODE}
│ prefix: ${prefix}
│ uptime: ${uptime}
│ theme: popkidxmd
╰─┬────❍${readMore}
╭─┴❍「 ɢᴇɴᴇʀᴀʟ 」❍
│${prefix} ping
│${prefix} alive
│${prefix} owner
│${prefix} sudo
│${prefix} infobot
│${prefix} menu
╰─┬────❍
╭─┴❍「 ᴀɪ ᴄʜᴀᴛ 」❍
│${prefix} ai
│${prefix} gpt
│${prefix} bot
│${prefix} chatbot
│${prefix} lydea
│${prefix} lydia
│${prefix} autoreply
│${prefix} chat
│${prefix} remini
│${prefix} voicechat
╰─┬────❍
╭─┴❍「 ᴛᴏᴏʟs 」❍
│${prefix} calculator
│${prefix} tempfile
│${prefix} checkmail
│${prefix} trt
│${prefix} tts
│${prefix} ss
│${prefix} qr
│${prefix} readqr
│${prefix} shortenerurl
│${prefix} profile
│${prefix} sapk
│${prefix} url
│${prefix} tourl
│${prefix} app
│${prefix} playstore
╰─┬────❍
╭─┴❍「 ᴄᴏɴᴠᴇʀᴛᴇʀꜱ 」❍
│${prefix} attp
│${prefix} binary
│${prefix} ebinary
│${prefix} emomix
╰─┬────❍
╭─┴❍「 ɢᴀᴍᴇꜱ+ꜰᴜɴ 」❍
│${prefix} ttt
│${prefix} wcg
│${prefix} connect4
│${prefix} joke
│${prefix} advice
│${prefix} meme
│${prefix} rank
│${prefix} roast
│${prefix} quote
╰─┬────❍
╭─┴❍「 ᴅᴏᴡɴʟᴏᴀᴅꜱ 」❍
│${prefix} apk
│${prefix} facebook
│${prefix} insta
│${prefix} tiktok
│${prefix} mediafire
│${prefix} pinterestdl
│${prefix} gdrive
│${prefix} play
│${prefix} song
│${prefix} video
│${prefix} smedia
│${prefix} movie
│${prefix} image
│${prefix} yts
│${prefix} lyrics
│${prefix} twitter
╰─┬────❍
╭─┴❍「 ʀᴇʟɪɢɪᴏɴ 」❍
│${prefix} bible
│${prefix} surahmenu
│${prefix} quranvid
│${prefix} qvid
│${prefix} qimg
│${prefix} surahaudio
│${prefix} asmaulhusna
│${prefix} prophetname
╰─┬────❍
╭─┴❍「 ɢʀᴏᴜᴘ 」❍
│${prefix} linkgroup
│${prefix} setppg
│${prefix} setname
│${prefix} setdesc
│${prefix} groupinfo
│${prefix} welcome
│${prefix} kick
│${prefix} add
│${prefix} promote
│${prefix} demote
│${prefix} tagall
│${prefix} hidetag
│${prefix} antilink
│${prefix} antibot
│${prefix} poll
╰─┬────❍
╭─┴❍「 ꜱᴛᴀʟᴋᴇʀ ᴛᴏᴏʟꜱ 」❍
│${prefix} truecaller
│${prefix} instastalk
│${prefix} tiktokstalk
│${prefix} githubstalk
╰─┬────❍
╭─┴❍「 ᴡᴀʟʟᴘᴀᴘᴇʀꜱ 」❍
│${prefix} anime
│${prefix} naruto
│${prefix} sasuke
│${prefix} random
╰─┬────❍
╭─┴❍「 ʜᴇɴᴛᴀɪ/ɴꜱꜰᴡ 」❍
│${prefix} hwaifu
│${prefix} blowjob
│${prefix} neko
│${prefix} milf
│${prefix} pussy
│${prefix} yuri
╰─┬────❍
╭─┴❍「 ʀᴇᴀᴄᴛɪᴏɴꜱ 」❍
│${prefix} highfive
│${prefix} handhold
│${prefix} cuddle
│${prefix} happy
│${prefix} dance
│${prefix} smile
│${prefix} blush
╰─┬────❍
╭─┴❍「 ᴀᴜᴅɪᴏ ᴇᴅɪᴛ 」❍
│${prefix} say
│${prefix} bass
│${prefix} deep
│${prefix} earrape
│${prefix} fast
│${prefix} robot
│${prefix} slow
│${prefix} smooth
╰─┬────❍
╭─┴❍「 ʟᴏɢᴏ ᴍᴀᴋᴇʀ 」❍
│${prefix} logo
│${prefix} gfx
│${prefix} carbon
╰─┬────❍
╭─┴❍「 ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ 」❍
│${prefix} restart
│${prefix} update
│${prefix} block
│${prefix} unblock
│${prefix} jid
│${prefix} join
│${prefix} leave
│${prefix} setstatus
│${prefix} autobio
╰─┬────❍
╭─┴❍「 ᴇᴄᴏɴᴏᴍʏ 」❍
│${prefix} balance
│${prefix} daily
│${prefix} deposit
│${prefix} withdraw
│${prefix} transfer
╰─┬────❍
╭─┴❍「 ᴘʀᴇᴍɪᴜᴍ ʙᴜɢꜱ 」❍
│${prefix} bugmenu
│${prefix} docbug
│${prefix} amountbug
│${prefix} gcbug
╰─────────────❍
ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ xᴍᴅ
`;

            // Message Configuration
            const menuMessage = {
                image: { url: "https://files.catbox.moe/yr339d.jpg" },
                caption: menuText,
                contextInfo: {
                    mentionedJid: [m.sender],
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363289379419860@newsletter",
                        newsletterName: "popkidxmd",
                        serverMessageId: -1
                    },
                    externalAdReply: {
                        title: "ᴘᴏᴘᴋɪᴅ xᴍᴅ",
                        body: "ᴀᴜᴛʜᴇɴᴛɪᴄ ʙᴏᴛ ᴇxᴘᴇʀɪᴇɴᴄᴇ",
                        thumbnailUrl: "https://files.catbox.moe/yr339d.jpg",
                        sourceUrl: "https://whatsapp.com/channel/0029VacgxK96hENmSRMRxx1r",
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            };

            await Matrix.sendMessage(m.from, menuMessage, { quoted: m });

            // Send Audio (Concept fix: send voice note with menu)
            await Matrix.sendMessage(m.from, {
                audio: { url: 'https://github.com/XdTechPro/KHAN-DATA/raw/refs/heads/main/autovoice/menunew.m4a' },
                mimetype: 'audio/mp4',
                ptt: true
            }, { quoted: m });

            // Reaction: Success
            await Matrix.sendMessage(m.from, {
                react: { text: '✅', key: m.key }
            });

        } catch (err) {
            console.error(err);
            // Fallback text if image fails
            await Matrix.sendMessage(m.from, { text: "⚠️ Error: Menu could not be loaded." }, { quoted: m });
        }
    }
};

export default LogoCmd;
